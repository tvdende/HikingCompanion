import type { Coordinate } from '../types/index.js';
import type { RouteWaypoint, RouteSegment } from '../types/route-planner.js';
import { calculateHaversineDistanceKm } from '../index.js';

/**
 * Linearly interpolates geodesic coordinates between two points.
 * Ensures fine-grained geometry even when routing in straight-line mode.
 */
export function interpolateStraightLine(
  from: Coordinate,
  to: Coordinate,
  stepMeters = 100
): Coordinate[] {
  const distKm = calculateHaversineDistanceKm(from, to);
  const distMeters = distKm * 1000;

  if (distMeters <= stepMeters) {
    return [
      { lat: from.lat, lng: from.lng, elevation: from.elevation },
      { lat: to.lat, lng: to.lng, elevation: to.elevation },
    ];
  }

  const steps = Math.max(1, Math.floor(distMeters / stepMeters));
  const result: Coordinate[] = [];

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = from.lat + (to.lat - from.lat) * fraction;
    const lng = from.lng + (to.lng - from.lng) * fraction;
    const elevation =
      from.elevation !== undefined && to.elevation !== undefined
        ? from.elevation + (to.elevation - from.elevation) * fraction
        : from.elevation ?? to.elevation;

    result.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      elevation: elevation !== undefined ? Number(elevation.toFixed(1)) : undefined,
    });
  }

  return result;
}

/**
 * Inserts a new waypoint at the specified index.
 */
export function insertWaypoint(
  waypoints: readonly RouteWaypoint[],
  newWaypoint: RouteWaypoint,
  index: number
): RouteWaypoint[] {
  const clampedIndex = Math.max(0, Math.min(index, waypoints.length));
  const updated = [...waypoints];
  updated.splice(clampedIndex, 0, newWaypoint);
  return updated;
}

/**
 * Removes a waypoint by its ID.
 */
export function deleteWaypoint(
  waypoints: readonly RouteWaypoint[],
  waypointId: string
): RouteWaypoint[] {
  return waypoints.filter((wp) => wp.id !== waypointId);
}

/**
 * Updates the coordinate of a specific waypoint.
 */
export function moveWaypoint(
  waypoints: readonly RouteWaypoint[],
  waypointId: string,
  newCoordinate: Coordinate
): RouteWaypoint[] {
  return waypoints.map((wp) =>
    wp.id === waypointId ? { ...wp, coordinate: newCoordinate } : wp
  );
}

/**
 * Reverses the order of waypoints.
 */
export function reverseWaypoints(waypoints: readonly RouteWaypoint[]): RouteWaypoint[] {
  return [...waypoints].reverse();
}

/**
 * Stitches together coordinates from sequential segments into a single contiguous track.
 */
export function flattenRouteCoordinates(
  waypoints: readonly RouteWaypoint[],
  segments: readonly RouteSegment[]
): Coordinate[] {
  if (waypoints.length === 0) return [];
  if (waypoints.length === 1) return [waypoints[0].coordinate];

  const coords: Coordinate[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const fromWp = waypoints[i];
    const toWp = waypoints[i + 1];
    const segment = segments.find(
      (s) => s.fromWaypointId === fromWp.id && s.toWaypointId === toWp.id
    );

    const segmentCoords =
      segment && segment.coordinates.length > 0
        ? segment.coordinates
        : interpolateStraightLine(fromWp.coordinate, toWp.coordinate);

    for (let j = 0; j < segmentCoords.length; j++) {
      // Avoid duplicate points at segment boundaries
      if (coords.length > 0 && j === 0) {
        continue;
      }
      coords.push(segmentCoords[j]);
    }
  }

  return coords;
}
