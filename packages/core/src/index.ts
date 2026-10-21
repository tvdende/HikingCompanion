export * from './types/index.js';
export * from './gpx/parser.js';
export * from './gpx/metrics.js';
export * from './gpx/serializer.js';
export * from './route-editing/index.js';

/**
 * Calculates straight-line distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const earthRadiusKm = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(2));
}

/**
 * Validates a coordinate object.
 */
export function isValidCoordinate(coord: unknown): boolean {
  if (!coord || typeof coord !== 'object') return false;
  const c = coord as { lat?: unknown; lng?: unknown };
  return (
    typeof c.lat === 'number' &&
    !isNaN(c.lat) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    typeof c.lng === 'number' &&
    !isNaN(c.lng) &&
    c.lng >= -180 &&
    c.lng <= 180
  );
}
