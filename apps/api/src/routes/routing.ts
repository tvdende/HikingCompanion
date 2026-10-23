import { Hono } from 'hono';
import {
  interpolateStraightLine,
  calculateHaversineDistanceKm,
  type Coordinate,
} from '@hiking-companion/core';
import type { Env } from '../index.js';

export const routingRoutes = new Hono<{ Bindings: Env }>();

interface RoutingRequestBody {
  coordinates: Array<{ lat: number; lng: number } | [number, number]>;
  profile?: 'foot' | 'straight';
}

function normalizeCoordinates(
  raw: Array<{ lat: number; lng: number } | [number, number]>
): Coordinate[] {
  return raw.map((c) => {
    if (Array.isArray(c)) {
      return { lng: c[0], lat: c[1] };
    }
    return { lat: c.lat, lng: c.lng };
  });
}

/**
 * Generates direct geodesic straight-line coordinates between points.
 */
function generateStraightLine(coords: Coordinate[]) {
  const result: Coordinate[] = [];
  let totalDistanceMeters = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i];
    const to = coords[i + 1];
    const segment = interpolateStraightLine(from, to, 100);
    const distKm = calculateHaversineDistanceKm(from, to);
    totalDistanceMeters += distKm * 1000;

    for (let j = 0; j < segment.length; j++) {
      if (result.length > 0 && j === 0) continue;
      result.push(segment[j]);
    }
  }

  return {
    coordinates: result,
    distanceMeters: Math.round(totalDistanceMeters),
    durationSeconds: Math.round(totalDistanceMeters / 1.34), // ~4.8 km/h walking speed
  };
}

// POST /api/routing/route
routingRoutes.post('/route', async (c) => {
  let body: RoutingRequestBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.coordinates || !Array.isArray(body.coordinates) || body.coordinates.length < 2) {
    return c.json({ error: 'At least two coordinates are required' }, 400);
  }

  const coords = normalizeCoordinates(body.coordinates);
  const profile = body.profile || 'foot';

  // Handle straight line explicitly
  if (profile === 'straight') {
    const straight = generateStraightLine(coords);
    return c.json({
      success: true,
      profile: 'straight',
      isFallback: false,
      coordinates: straight.coordinates,
      distanceMeters: straight.distanceMeters,
      durationSeconds: straight.durationSeconds,
    });
  }

  // 1. Try BRouter trekking/hiking profile (high-quality OpenStreetMap foot trails)
  const brouterLonLats = coords.map((pt) => `${pt.lng},${pt.lat}`).join('|');
  const brouterEndpoint = `https://brouter.de/brouter?lonlats=${brouterLonLats}&profile=trekking&format=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(brouterEndpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HikingCompanion/0.1.0',
        'Referer': 'https://brouter.de/brouter-web/',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as any;
      const feature = data.features?.[0];
      if (feature && feature.geometry && Array.isArray(feature.geometry.coordinates)) {
        const rawCoords: [number, number, ...number[]][] = feature.geometry.coordinates;
        const formattedCoords: Coordinate[] = rawCoords.map(([lng, lat, ele]) => ({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          elevation: typeof ele === 'number' ? Number(ele.toFixed(1)) : undefined,
        }));

        const distanceMeters = Math.round(Number(feature.properties?.['track-length'] || 0));
        const durationSeconds = Math.round(
          Number(feature.properties?.['total-time'] || (distanceMeters / 1.34))
        );

        return c.json({
          success: true,
          profile: 'foot',
          isFallback: false,
          coordinates: formattedCoords,
          distanceMeters,
          durationSeconds,
        });
      }
    }
  } catch (brouterErr) {
    console.warn('BRouter routing failed, attempting fallback...', brouterErr);
  }

  // 2. Fallback to OSRM foot routing
  const coordString = coords.map((pt) => `${pt.lng},${pt.lat}`).join(';');
  const osrmEndpoint = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(osrmEndpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HikingCompanion/0.1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geojsonCoords: [number, number][] = route.geometry.coordinates;
        const formattedCoords: Coordinate[] = geojsonCoords.map(([lng, lat]) => ({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        }));

        return c.json({
          success: true,
          profile: 'foot',
          isFallback: false,
          coordinates: formattedCoords,
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
        });
      }
    }
  } catch {
    // Continue to straight-line fallback
  }

  // 3. Graceful fallback to geodesic straight line
  const fallback = generateStraightLine(coords);
  return c.json({
    success: true,
    profile: 'foot',
    isFallback: true,
    warning: 'Routing service unavailable. Path rendered via straight-line fallback.',
    coordinates: fallback.coordinates,
    distanceMeters: fallback.distanceMeters,
    durationSeconds: fallback.durationSeconds,
  });
});
