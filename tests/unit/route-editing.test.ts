import { describe, it, expect } from 'vitest';
import {
  interpolateStraightLine,
  insertWaypoint,
  deleteWaypoint,
  moveWaypoint,
  reverseWaypoints,
  flattenRouteCoordinates,
  extractWaypointsFromRoute,
  diffRouteSegments,
  createWaypointPairs,
  type RouteWaypoint,
  type RouteSegment,
  type HikeRoute,
} from '@hiking-companion/core';

describe('Route Editing Domain Utilities', () => {
  const wp1: RouteWaypoint = {
    id: 'wp-1',
    coordinate: { lat: 52.0907, lng: 5.1214, elevation: 10 },
    routingMode: 'snap',
  };
  const wp2: RouteWaypoint = {
    id: 'wp-2',
    coordinate: { lat: 52.1, lng: 5.13, elevation: 20 },
    routingMode: 'snap',
  };
  const wp3: RouteWaypoint = {
    id: 'wp-3',
    coordinate: { lat: 52.11, lng: 5.14, elevation: 30 },
    routingMode: 'direct',
  };

  describe('interpolateStraightLine', () => {
    it('returns direct endpoints when distance is very short', () => {
      const from = { lat: 52.0907, lng: 5.1214 };
      const to = { lat: 52.09071, lng: 5.12141 };
      const result = interpolateStraightLine(from, to, 100);
      expect(result).toHaveLength(2);
      expect(result[0].lat).toBe(from.lat);
      expect(result[1].lat).toBe(to.lat);
    });

    it('interpolates intermediate points for distant coordinates', () => {
      const from = { lat: 52.0, lng: 5.0, elevation: 10 };
      const to = { lat: 52.05, lng: 5.05, elevation: 60 };
      const result = interpolateStraightLine(from, to, 500);
      expect(result.length).toBeGreaterThan(2);
      expect(result[0].lat).toBe(52.0);
      expect(result[result.length - 1].lat).toBe(52.05);
      expect(result[0].elevation).toBe(10);
      expect(result[result.length - 1].elevation).toBe(60);
    });
  });

  describe('insertWaypoint', () => {
    it('inserts waypoint at the specified index', () => {
      const list = [wp1, wp3];
      const result = insertWaypoint(list, wp2, 1);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('wp-1');
      expect(result[1].id).toBe('wp-2');
      expect(result[2].id).toBe('wp-3');
    });

    it('clamps index to bounds when appending or prepending', () => {
      const list = [wp1];
      const appended = insertWaypoint(list, wp2, 999);
      expect(appended).toHaveLength(2);
      expect(appended[1].id).toBe('wp-2');
    });
  });

  describe('deleteWaypoint', () => {
    it('removes waypoint by id and keeps others intact', () => {
      const list = [wp1, wp2, wp3];
      const result = deleteWaypoint(list, 'wp-2');
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.id)).toEqual(['wp-1', 'wp-3']);
    });
  });

  describe('moveWaypoint', () => {
    it('updates coordinate of the targeted waypoint', () => {
      const list = [wp1, wp2];
      const newCoord = { lat: 52.095, lng: 5.125 };
      const result = moveWaypoint(list, 'wp-1', newCoord);
      expect(result[0].coordinate).toEqual(newCoord);
      expect(result[1].coordinate).toEqual(wp2.coordinate);
    });
  });

  describe('reverseWaypoints', () => {
    it('reverses the waypoint sequence', () => {
      const list = [wp1, wp2, wp3];
      const result = reverseWaypoints(list);
      expect(result.map((w) => w.id)).toEqual(['wp-3', 'wp-2', 'wp-1']);
    });
  });

  describe('flattenRouteCoordinates', () => {
    it('returns empty array when no waypoints exist', () => {
      expect(flattenRouteCoordinates([], [])).toEqual([]);
    });

    it('returns single coordinate when only one waypoint exists', () => {
      expect(flattenRouteCoordinates([wp1], [])).toEqual([wp1.coordinate]);
    });

    it('stitches segment coordinates without duplicate boundary coordinates', () => {
      const segment1: RouteSegment = {
        id: 'seg-1',
        fromWaypointId: 'wp-1',
        toWaypointId: 'wp-2',
        routingMode: 'snap',
        coordinates: [
          { lat: 52.0907, lng: 5.1214 },
          { lat: 52.095, lng: 5.125 },
          { lat: 52.1, lng: 5.13 },
        ],
        distanceMeters: 1200,
      };

      const segment2: RouteSegment = {
        id: 'seg-2',
        fromWaypointId: 'wp-2',
        toWaypointId: 'wp-3',
        routingMode: 'direct',
        coordinates: [
          { lat: 52.1, lng: 5.13 },
          { lat: 52.105, lng: 5.135 },
          { lat: 52.11, lng: 5.14 },
        ],
        distanceMeters: 1100,
      };

      const coords = flattenRouteCoordinates([wp1, wp2, wp3], [segment1, segment2]);
      expect(coords).toHaveLength(5);
      expect(coords[0]).toEqual({ lat: 52.0907, lng: 5.1214 });
      expect(coords[2]).toEqual({ lat: 52.1, lng: 5.13 });
      expect(coords[4]).toEqual({ lat: 52.11, lng: 5.14 });
    });
  });

  describe('extractWaypointsFromRoute', () => {
    it('returns empty waypoints and segments when route has no coordinates', () => {
      const emptyRoute: HikeRoute = {
        id: 'test-empty',
        name: 'Empty Route',
        stages: [],
        totalDistanceKm: 0,
        elevationGainM: 0,
        elevationLossM: 0,
        estimatedDurationMinutes: 0,
      };
      const result = extractWaypointsFromRoute(emptyRoute);
      expect(result.waypoints).toHaveLength(0);
      expect(result.segments).toHaveLength(0);
    });

    it('extracts waypoints and segments from multi-point route stages', () => {
      const route: HikeRoute = {
        id: 'test-route',
        name: 'Track Route',
        stages: [
          {
            id: 'stage-1',
            name: 'Stage 1',
            coordinates: [
              { lat: 52.0, lng: 5.0, elevation: 10 },
              { lat: 52.01, lng: 5.01, elevation: 12 },
              { lat: 52.02, lng: 5.02, elevation: 15 },
              { lat: 52.03, lng: 5.03, elevation: 18 },
              { lat: 52.04, lng: 5.04, elevation: 20 },
            ],
            distanceKm: 4.5,
            elevationGainM: 10,
            elevationLossM: 0,
          },
        ],
        totalDistanceKm: 4.5,
        elevationGainM: 10,
        elevationLossM: 0,
        estimatedDurationMinutes: 60,
      };

      const result = extractWaypointsFromRoute(route, 3);
      expect(result.waypoints).toHaveLength(3);
      expect(result.waypoints[0].name).toBe('Start');
      expect(result.waypoints[2].name).toBe('Finish');
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].coordinates.length).toBeGreaterThan(1);
    });
  });

  describe('diffRouteSegments', () => {
    const seg1: RouteSegment = {
      id: 'seg-wp-1-wp-2',
      fromWaypointId: 'wp-1',
      toWaypointId: 'wp-2',
      routingMode: 'snap',
      coordinates: [
        { lat: 52.0907, lng: 5.1214 },
        { lat: 52.095, lng: 5.125 },
        { lat: 52.1, lng: 5.13 },
      ],
      distanceMeters: 1200,
    };

    const seg2: RouteSegment = {
      id: 'seg-wp-2-wp-3',
      fromWaypointId: 'wp-2',
      toWaypointId: 'wp-3',
      routingMode: 'direct',
      coordinates: [
        { lat: 52.1, lng: 5.13 },
        { lat: 52.11, lng: 5.14 },
      ],
      distanceMeters: 1100,
    };

    it('identifies intact segments when appending a new waypoint', () => {
      const wp4: RouteWaypoint = {
        id: 'wp-4',
        coordinate: { lat: 52.12, lng: 5.15 },
        routingMode: 'snap',
      };
      const waypoints = [wp1, wp2, wp3, wp4];
      const targetPairs = createWaypointPairs(waypoints);

      const diff = diffRouteSegments([seg1, seg2], targetPairs);

      expect(diff.retainedSegments.size).toBe(2);
      expect(diff.retainedSegments.get(0)?.id).toBe('seg-wp-1-wp-2');
      expect(diff.retainedSegments.get(1)?.id).toBe('seg-wp-2-wp-3');
      expect(diff.dirtyPairs).toHaveLength(1);
      expect(diff.dirtyPairs[0].index).toBe(2);
      expect(diff.dirtyPairs[0].from.id).toBe('wp-3');
      expect(diff.dirtyPairs[0].to.id).toBe('wp-4');
    });

    it('marks adjacent segments as dirty when inserting an intermediate waypoint', () => {
      const wpInserted: RouteWaypoint = {
        id: 'wp-inserted',
        coordinate: { lat: 52.095, lng: 5.125 },
        routingMode: 'snap',
      };
      // Insert between wp1 and wp2: [wp1, wpInserted, wp2, wp3]
      const waypoints = [wp1, wpInserted, wp2, wp3];
      const targetPairs = createWaypointPairs(waypoints);

      const diff = diffRouteSegments([seg1, seg2], targetPairs);

      // (wp1, wpInserted) is dirty
      // (wpInserted, wp2) is dirty
      // (wp2, wp3) matches seg2 and is retained at index 2
      expect(diff.retainedSegments.size).toBe(1);
      expect(diff.retainedSegments.get(2)?.id).toBe('seg-wp-2-wp-3');
      expect(diff.dirtyPairs).toHaveLength(2);
      expect(diff.dirtyPairs[0].index).toBe(0);
      expect(diff.dirtyPairs[1].index).toBe(1);
    });

    it('marks incoming and outgoing segments dirty when moving an intermediate waypoint', () => {
      const movedWp2: RouteWaypoint = {
        id: 'wp-2',
        coordinate: { lat: 52.105, lng: 5.135 }, // altered coordinate
        routingMode: 'snap',
      };
      const wp4: RouteWaypoint = {
        id: 'wp-4',
        coordinate: { lat: 52.12, lng: 5.15 },
        routingMode: 'direct',
      };
      const seg3: RouteSegment = {
        id: 'seg-wp-3-wp-4',
        fromWaypointId: 'wp-3',
        toWaypointId: 'wp-4',
        routingMode: 'direct',
        coordinates: [
          { lat: 52.11, lng: 5.14 },
          { lat: 52.12, lng: 5.15 },
        ],
        distanceMeters: 1000,
      };

      const waypoints = [wp1, movedWp2, wp3, wp4];
      const targetPairs = createWaypointPairs(waypoints);

      const diff = diffRouteSegments([seg1, seg2, seg3], targetPairs);

      // (wp1 -> movedWp2) dirty due to coordinate mismatch
      // (movedWp2 -> wp3) dirty due to coordinate mismatch
      // (wp3 -> wp4) retained at index 2
      expect(diff.retainedSegments.size).toBe(1);
      expect(diff.retainedSegments.get(2)?.id).toBe('seg-wp-3-wp-4');
      expect(diff.dirtyPairs).toHaveLength(2);
      expect(diff.dirtyPairs[0].index).toBe(0);
      expect(diff.dirtyPairs[1].index).toBe(1);
    });

    it('marks segment dirty when routingMode is changed', () => {
      // Change wp2 routingMode to 'direct' instead of 'snap'
      const modifiedWp2: RouteWaypoint = {
        ...wp2,
        routingMode: 'direct',
      };
      const targetPairs = createWaypointPairs([wp1, modifiedWp2]);

      const diff = diffRouteSegments([seg1], targetPairs);

      expect(diff.retainedSegments.size).toBe(0);
      expect(diff.dirtyPairs).toHaveLength(1);
      expect(diff.dirtyPairs[0].routingMode).toBe('direct');
    });
  });
});

