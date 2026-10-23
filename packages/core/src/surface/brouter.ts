import type { Coordinate, SurfaceSegment } from '../types/index.js';
import { calculateHaversineDistanceKm } from '../index.js';
import { classifySurface } from './classifier.js';

export type BRouterMessages = string[][];

const MESSAGE_COORDINATE_TOLERANCE_METERS = 2;

function segmentDistanceMeters(coordinates: Coordinate[]): number {
  return Math.round(
    coordinates.slice(1).reduce(
      (total, coordinate, index) => total + calculateHaversineDistanceKm(coordinates[index], coordinate) * 1000,
      0
    )
  );
}

function createSegment(
  coordinates: Coordinate[],
  stageId: string,
  category: SurfaceSegment['category']
): SurfaceSegment | undefined {
  if (coordinates.length < 2) return undefined;

  const distanceMeters = segmentDistanceMeters(coordinates);
  return distanceMeters > 0
    ? { stageId, category, coordinates, distanceMeters }
    : undefined;
}

function nearestCoordinateIndex(
  coordinates: Coordinate[],
  longitude: number,
  latitude: number
): number | undefined {
  let nearestIndex = -1;
  let nearestDistanceMeters = Infinity;

  for (const [index, coordinate] of coordinates.entries()) {
    const distanceMeters = calculateHaversineDistanceKm(
      coordinate,
      { lng: longitude, lat: latitude }
    ) * 1000;
    if (distanceMeters < nearestDistanceMeters) {
      nearestIndex = index;
      nearestDistanceMeters = distanceMeters;
    }
  }

  return nearestDistanceMeters <= MESSAGE_COORDINATE_TOLERANCE_METERS
    ? nearestIndex
    : undefined;
}

export function parseBRouterMessages(
  messages: BRouterMessages,
  coordinates: Coordinate[],
  stageId: string
): SurfaceSegment[] {
  if (coordinates.length < 2) return [];

  const header = messages[0] ?? [];
  const longitudeIndex = header.indexOf('Longitude');
  const latitudeIndex = header.indexOf('Latitude');
  const wayTagsIndex = header.indexOf('WayTags');
  if (longitudeIndex < 0 || latitudeIndex < 0 || wayTagsIndex < 0) {
    const unknown = createSegment(coordinates, stageId, 'unknown');
    return unknown ? [unknown] : [];
  }

  const spans = messages.slice(1).flatMap((row) => {
    const longitude = Number(row[longitudeIndex]) / 1_000_000;
    const latitude = Number(row[latitudeIndex]) / 1_000_000;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return [];

    const toIndex = nearestCoordinateIndex(coordinates, longitude, latitude);
    if (toIndex === undefined) return [];

    const tags = Object.fromEntries(
      (row[wayTagsIndex] ?? '').split(' ').flatMap((tag) => {
        const separator = tag.indexOf('=');
        return separator > 0 ? [[tag.slice(0, separator), tag.slice(separator + 1)]] : [];
      })
    );
    return [{ toIndex, tags }];
  });
  const segments: SurfaceSegment[] = [];
  let index = 0;

  for (const span of spans) {
    if (span.toIndex < index) continue;
    if (span.toIndex === index) continue;

    const spanCoordinates = coordinates.slice(index, span.toIndex + 1);
    const segment = createSegment(spanCoordinates, stageId, classifySurface(span.tags));
    if (segment) segments.push(segment);
    index = span.toIndex;
  }

  if (index < coordinates.length - 1) {
    const uncovered = coordinates.slice(index);
    const segment = createSegment(uncovered, stageId, 'unknown');
    if (segment) segments.push(segment);
  }
  return segments;
}