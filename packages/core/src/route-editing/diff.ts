import type { Coordinate } from '../types/index.js';
import type { RouteWaypoint, RouteSegment, RoutingMode } from '../types/route-planner.js';
import { normalizeCoord } from './segment-cache.js';

export interface TargetWaypointPair {
  from: RouteWaypoint;
  to: RouteWaypoint;
  index: number;
  routingMode: RoutingMode;
}

export interface SegmentDiffResult {
  /** Segments retained from currentSegments mapped by target index */
  retainedSegments: Map<number, RouteSegment>;
  /** Segments retained as a list with target index */
  retainedList: Array<{ index: number; segment: RouteSegment }>;
  /** Pairs that require calculation */
  dirtyPairs: TargetWaypointPair[];
}

export function isSameCoordinate(c1: Coordinate, c2: Coordinate): boolean {
  const n1 = normalizeCoord(c1);
  const n2 = normalizeCoord(c2);
  return n1.lat === n2.lat && n1.lng === n2.lng;
}

/**
 * Creates target waypoint pairs from a list of waypoints.
 */
export function createWaypointPairs(
  waypoints: readonly RouteWaypoint[],
  defaultMode: RoutingMode = 'snap'
): TargetWaypointPair[] {
  const pairs: TargetWaypointPair[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    pairs.push({
      from,
      to,
      index: i,
      routingMode: to.routingMode || defaultMode,
    });
  }
  return pairs;
}

/**
 * Compares current calculated route segments against target waypoint pairs.
 * Identifies intact segments that can be directly retained without recalculation.
 */
export function diffRouteSegments(
  currentSegments: readonly RouteSegment[],
  targetWaypointPairs: readonly TargetWaypointPair[]
): SegmentDiffResult {
  const retainedSegments = new Map<number, RouteSegment>();
  const retainedList: Array<{ index: number; segment: RouteSegment }> = [];
  const dirtyPairs: TargetWaypointPair[] = [];

  for (const pair of targetWaypointPairs) {
    const { from, to, index, routingMode } = pair;

    // Find matching segment in currentSegments
    const match = currentSegments.find((seg) => {
      if (seg.fromWaypointId !== from.id || seg.toWaypointId !== to.id) {
        return false;
      }
      if (seg.routingMode !== routingMode) {
        return false;
      }
      if (!seg.coordinates || seg.coordinates.length < 2) {
        return false;
      }
      const firstCoord = seg.coordinates[0];
      const lastCoord = seg.coordinates[seg.coordinates.length - 1];
      return (
        isSameCoordinate(firstCoord, from.coordinate) &&
        isSameCoordinate(lastCoord, to.coordinate)
      );
    });

    if (match) {
      retainedSegments.set(index, match);
      retainedList.push({ index, segment: match });
    } else {
      dirtyPairs.push(pair);
    }
  }

  return {
    retainedSegments,
    retainedList,
    dirtyPairs,
  };
}
