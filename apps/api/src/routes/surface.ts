import { Hono } from 'hono';
import {
  calculateHaversineDistanceKm,
  calculateSurfaceBreakdown,
  classifySurface,
  isValidCoordinate,
  parseBRouterMessages,
  type Coordinate,
  type HikeStage,
  type SurfaceBreakdown,
  type SurfaceSegment,
} from '@hiking-companion/core';
import type { Env } from '../index.js';

export const surfaceRoutes = new Hono<{ Bindings: Env }>();

interface OverpassWay {
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

const OVERPASS_SAMPLE_BATCH_SIZE = 30;
const OVERPASS_TIMEOUT_MS = 5_000;
const BROUTER_MAX_WAYPOINTS = 50;

function downsample(coordinates: Coordinate[]): Coordinate[] {
  const result = [coordinates[0]];
  let previous = coordinates[0];
  for (const coordinate of coordinates.slice(1, -1)) {
    if (calculateHaversineDistanceKm(previous, coordinate) * 1000 >= 100) {
      result.push(coordinate);
      previous = coordinate;
    }
  }
  result.push(coordinates[coordinates.length - 1]);
  return result;
}

function downsampleForBRouter(coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length <= BROUTER_MAX_WAYPOINTS) return coordinates;

  const result: Coordinate[] = [];
  for (let index = 0; index < BROUTER_MAX_WAYPOINTS; index++) {
    const coordinateIndex = Math.round(
      (index * (coordinates.length - 1)) / (BROUTER_MAX_WAYPOINTS - 1)
    );
    result.push(coordinates[coordinateIndex]);
  }
  return result;
}

function unknownSegments(coordinates: Coordinate[], stageId: string): SurfaceSegment[] {
  return coordinates.slice(1).map((coordinate, index) => ({
    stageId,
    category: 'unknown' as const,
    coordinates: [coordinates[index], coordinate],
    distanceMeters: Math.round(calculateHaversineDistanceKm(coordinates[index], coordinate) * 1000),
  })).filter((segment) => segment.distanceMeters > 0);
}

function nearestTags(coordinate: Coordinate, ways: OverpassWay[]): Record<string, string> | undefined {
  const candidates = ways.flatMap((way) => (way.geometry ?? []).map((point) => ({
    id: way.id,
    tags: way.tags ?? {},
    distance: calculateHaversineDistanceKm(coordinate, { lat: point.lat, lng: point.lon }) * 1000,
  }))).filter((candidate) => candidate.distance <= 25);
  candidates.sort((left, right) => left.distance - right.distance || left.id - right.id);
  return candidates[0]?.tags;
}

async function cacheRequest(coordinates: Coordinate[], stageId: string): Promise<Request> {
  const canonical = `surface-v2:${stageId}:${coordinates.map((point) => `${point.lng.toFixed(5)},${point.lat.toFixed(5)}`).join(';')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return new Request(`https://surface-cache.invalid/${hash}`);
}

function workerCache(): Cache | undefined {
  return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
}

async function fetchOverpassWays(samples: Coordinate[]): Promise<OverpassWay[]> {
  const batches: Coordinate[][] = [];
  for (let index = 0; index < samples.length; index += OVERPASS_SAMPLE_BATCH_SIZE) {
    batches.push(samples.slice(index, index + OVERPASS_SAMPLE_BATCH_SIZE));
  }

  const responses = await Promise.all(batches.map(async (batch) => {
    const query = `[out:json][timeout:5];(${batch.map((point) => `way(around:25,${point.lat},${point.lng})[highway];`).join('')});out tags geom;`;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Overpass returned ${response.status}`);
    const payload = await response.json() as { elements?: OverpassWay[] };
    return payload.elements ?? [];
  }));

  return responses.flat();
}

async function analyzeWithBRouter(coordinates: Coordinate[], stageId: string): Promise<SurfaceBreakdown> {
  const routeCoordinates = downsampleForBRouter(coordinates);
  const lonLats = routeCoordinates.map((point) => `${point.lng},${point.lat}`).join('|');
  const response = await fetch(
    `https://brouter.de/brouter?lonlats=${lonLats}&profile=trekking&format=geojson`,
    {
      headers: {
        'User-Agent': 'HikingCompanion/0.1.0',
        'Referer': 'https://brouter.de/brouter-web/',
      },
      signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
    }
  );
  if (!response.ok) throw new Error(`BRouter returned ${response.status}`);

  const data = await response.json() as {
    features?: Array<{
      geometry?: { coordinates?: Array<[number, number, number?]> };
      properties?: { messages?: string[][] };
    }>;
  };
  const feature = data.features?.[0];
  const geometry = feature?.geometry?.coordinates;
  if (!geometry || geometry.length < 2) throw new Error('BRouter returned no route geometry');

  const routedCoordinates = geometry.map(([lng, lat, elevation]) => ({
    lng: Number(lng.toFixed(6)),
    lat: Number(lat.toFixed(6)),
    elevation: typeof elevation === 'number' ? Number(elevation.toFixed(1)) : undefined,
  }));
  const segments = parseBRouterMessages(feature?.properties?.messages ?? [], routedCoordinates, stageId);
  return calculateSurfaceBreakdown(segments, 'brouter');
}

export async function analyzeSurface(coordinates: Coordinate[], stageId: string) {
  const request = await cacheRequest(coordinates, stageId);
  const cache = workerCache();
  const cached = await cache?.match(request);
  if (cached) return await cached.json() as SurfaceBreakdown;
  const fallbackSegments = unknownSegments(coordinates, stageId);
  const samples = downsample(coordinates);
  try {
    const ways = await fetchOverpassWays(samples);
    const segments = coordinates.slice(1).map((coordinate, index) => {
      const tags = nearestTags(coordinates[index], ways) ?? nearestTags(coordinate, ways);
      return { ...fallbackSegments[index], category: tags ? classifySurface(tags) : 'unknown' };
    });
    const result = calculateSurfaceBreakdown(segments, 'overpass');
    await cache?.put(request, new Response(JSON.stringify(result)));
    return result;
  } catch (overpassError) {
    console.warn('Overpass surface analysis failed; falling back to BRouter.', overpassError);
    try {
      const result = await analyzeWithBRouter(coordinates, stageId);
      await cache?.put(request, new Response(JSON.stringify(result)));
      return result;
    } catch (brouterError) {
      console.warn('BRouter surface analysis fallback failed.', brouterError);
      return calculateSurfaceBreakdown(fallbackSegments, 'unavailable', 'unavailable');
    }
  }
}

export async function analyzeRouteSurface(stages: HikeStage[]): Promise<ReturnType<typeof calculateSurfaceBreakdown> | null> {
  const walkingStages = stages.filter(
    (stage) => (stage.transportType === undefined || stage.transportType === 'foot') && stage.coordinates.length > 1
  );
  if (walkingStages.length === 0) return null;

  const analyses = await Promise.all(
    walkingStages.map((stage) => analyzeSurface(stage.coordinates, stage.id))
  );
  const segments = analyses.flatMap((analysis) => analysis.segments);
  if (segments.length === 0) return null;
  const unavailable = analyses.some((analysis) => analysis.status === 'unavailable');
  const usedBRouter = analyses.some((analysis) => analysis.source === 'brouter');
  return calculateSurfaceBreakdown(
    segments,
    unavailable ? 'unavailable' : usedBRouter ? 'brouter' : 'overpass',
    unavailable ? 'unavailable' : 'complete'
  );
}

surfaceRoutes.post('/', async (c) => {
  let body: { coordinates?: Coordinate[]; stageId?: string; stages?: HikeStage[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
  if (body.stages) {
    const walkingStages = body.stages.filter(
      (stage) => (stage.transportType === undefined || stage.transportType === 'foot') &&
        Array.isArray(stage.coordinates) &&
        stage.coordinates.length > 1 &&
        stage.coordinates.every(isValidCoordinate)
    );
    if (walkingStages.length === 0) {
      return c.json({ error: 'At least one walking stage with two valid coordinates is required' }, 400);
    }
    const surfaceBreakdown = await analyzeRouteSurface(walkingStages);
    if (!surfaceBreakdown) {
      return c.json({ error: 'Surface analysis requires non-zero geometry' }, 400);
    }
    return c.json({ surfaceBreakdown });
  }

  const coordinates = body.coordinates ?? [];
  if (coordinates.length < 2 || !coordinates.every(isValidCoordinate)) {
    return c.json({ error: 'At least two valid coordinates are required' }, 400);
  }
  const fallbackSegments = unknownSegments(coordinates, body.stageId ?? 'stage-1');
  if (fallbackSegments.length === 0) {
    return c.json({ error: 'Surface analysis requires non-zero geometry' }, 400);
  }

  return c.json({ surfaceBreakdown: await analyzeSurface(coordinates, body.stageId ?? 'stage-1') });
});