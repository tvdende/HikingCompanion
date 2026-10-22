import { describe, it, expect } from 'vitest';
import {
  splitRouteAtWaypoint,
  mergeStages,
  reorderStages,
  deleteStageAndPoints,
  extractWaypointsPerStage,
  calculateStageMetrics,
  detectGpxTracks,
  parseGpx,
  serializeToGpx,
  type RouteWaypoint,
  type RouteSegment,
  type RouteStageDefinition,
  type HikeRoute,
} from '@hiking-companion/core';

describe('Multi-Stage & Public Transit Domain Utilities', () => {
  const initialStages: RouteStageDefinition[] = [
    { id: 'stage-1', stageNumber: 1, title: 'Etappe 1: Pieterburen – Winsum', transportType: 'foot' },
  ];

  const waypoints: RouteWaypoint[] = [
    { id: 'wp-1', coordinate: { lat: 53.4, lng: 6.4 }, routingMode: 'snap', stageId: 'stage-1' },
    { id: 'wp-2', coordinate: { lat: 53.35, lng: 6.45 }, routingMode: 'snap', stageId: 'stage-1' },
    { id: 'wp-3', coordinate: { lat: 53.3, lng: 6.5 }, routingMode: 'snap', stageId: 'stage-1' },
    { id: 'wp-4', coordinate: { lat: 53.25, lng: 6.55 }, routingMode: 'snap', stageId: 'stage-1' },
  ];

  describe('splitRouteAtWaypoint', () => {
    it('splits stage at intermediate waypoint wp-3 into two stages', () => {
      const result = splitRouteAtWaypoint(initialStages, waypoints, 'wp-3');
      expect(result.stages).toHaveLength(2);
      expect(result.stages[0].stageNumber).toBe(1);
      expect(result.stages[1].stageNumber).toBe(2);
      expect(result.newStageId).toBe(result.stages[1].id);

      // wp-1 and wp-2 remain in stage-1
      expect(result.waypoints[0].stageId).toBe('stage-1');
      expect(result.waypoints[1].stageId).toBe('stage-1');

      // wp-3 and wp-4 are moved to newStageId
      expect(result.waypoints[2].stageId).toBe(result.newStageId);
      expect(result.waypoints[3].stageId).toBe(result.newStageId);
    });

    it('throws when splitting at the first or out-of-bounds waypoint', () => {
      expect(() => splitRouteAtWaypoint(initialStages, waypoints, 'wp-1')).toThrow();
      expect(() => splitRouteAtWaypoint(initialStages, waypoints, 'wp-unknown')).toThrow();
    });
  });

  describe('mergeStages', () => {
    it('merges Stage 2 into Stage 1, transferring waypoints and renumbering', () => {
      const split = splitRouteAtWaypoint(initialStages, waypoints, 'wp-3');
      const merged = mergeStages(split.stages, split.waypoints, split.newStageId);

      expect(merged.stages).toHaveLength(1);
      expect(merged.stages[0].id).toBe('stage-1');
      expect(merged.activeStageId).toBe('stage-1');
      expect(merged.waypoints.every((wp) => wp.stageId === 'stage-1')).toBe(true);
    });
  });

  describe('reorderStages', () => {
    it('reorders stages and sorts waypoints accordingly', () => {
      const split = splitRouteAtWaypoint(initialStages, waypoints, 'wp-3');
      const stage2Id = split.newStageId;
      const reordered = reorderStages(split.stages, split.waypoints, [stage2Id, 'stage-1']);

      expect(reordered.stages[0].id).toBe(stage2Id);
      expect(reordered.stages[0].stageNumber).toBe(1);
      expect(reordered.stages[1].id).toBe('stage-1');
      expect(reordered.stages[1].stageNumber).toBe(2);

      // The waypoints of stage2Id should now precede stage-1 waypoints
      expect(reordered.waypoints[0].id).toBe('wp-3');
      expect(reordered.waypoints[1].id).toBe('wp-4');
      expect(reordered.waypoints[2].id).toBe('wp-1');
      expect(reordered.waypoints[3].id).toBe('wp-2');
    });
  });

  describe('deleteStageAndPoints', () => {
    it('deletes a stage, removes its waypoints, and renumbers remaining stages', () => {
      const split = splitRouteAtWaypoint(initialStages, waypoints, 'wp-3');
      const stage2Id = split.newStageId;
      const deleted = deleteStageAndPoints(split.stages, split.waypoints, stage2Id);

      expect(deleted.stages).toHaveLength(1);
      expect(deleted.stages[0].id).toBe('stage-1');
      expect(deleted.waypoints).toHaveLength(2);
      expect(deleted.waypoints.map((w) => w.id)).toEqual(['wp-1', 'wp-2']);
    });

    it('returns a fresh empty stage if all stages are deleted', () => {
      const deleted = deleteStageAndPoints(initialStages, waypoints, 'stage-1');
      expect(deleted.stages).toHaveLength(1);
      expect(deleted.stages[0].stageNumber).toBe(1);
      expect(deleted.waypoints).toHaveLength(0);
    });
  });

  describe('calculateStageMetrics', () => {
    it('separates walking distance from public transit distance', () => {
      const stages: RouteStageDefinition[] = [
        { id: 's-1', stageNumber: 1, title: 'Wandelen', transportType: 'foot' },
        { id: 's-2', stageNumber: 2, title: 'Bus transfer', transportType: 'bus' },
      ];

      const wps: RouteWaypoint[] = [
        { id: 'w1', coordinate: { lat: 52, lng: 5 }, routingMode: 'snap', stageId: 's-1' },
        { id: 'w2', coordinate: { lat: 52.1, lng: 5.1 }, routingMode: 'snap', stageId: 's-1' },
        { id: 'w3', coordinate: { lat: 52.1, lng: 5.1 }, routingMode: 'direct', stageId: 's-2' },
        { id: 'w4', coordinate: { lat: 52.3, lng: 5.3 }, routingMode: 'direct', stageId: 's-2' },
      ];

      const segments: RouteSegment[] = [
        {
          id: 'seg-1',
          fromWaypointId: 'w1',
          toWaypointId: 'w2',
          routingMode: 'snap',
          coordinates: [{ lat: 52, lng: 5 }, { lat: 52.1, lng: 5.1 }],
          distanceMeters: 10000,
          elevationGainMeters: 50,
          elevationLossMeters: 20,
        },
        {
          id: 'seg-2',
          fromWaypointId: 'w3',
          toWaypointId: 'w4',
          routingMode: 'direct',
          coordinates: [{ lat: 52.1, lng: 5.1 }, { lat: 52.3, lng: 5.3 }],
          distanceMeters: 25000,
          elevationGainMeters: 0,
          elevationLossMeters: 0,
        },
      ];

      const metrics = calculateStageMetrics(stages, segments, wps);
      expect(metrics.stages).toHaveLength(2);
      expect(metrics.stages[0].distanceKm).toBe(10);
      expect(metrics.stages[0].elevationGainMeters).toBe(50);
      expect(metrics.stages[1].distanceKm).toBe(25);
      expect(metrics.totalDistanceKm).toBe(35);
      expect(metrics.hikingDistanceKm).toBe(10);
      expect(metrics.transitDistanceKm).toBe(25);
    });
  });

  describe('detectGpxTracks & Multi-Track Parsing', () => {
    const multiTrackGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Etappe 1: Pieterburen</name>
    <desc>Overnachting op camping</desc>
    <trkseg>
      <trkpt lat="53.4000" lon="6.4000"><ele>5.0</ele></trkpt>
      <trkpt lat="53.3500" lon="6.4500"><ele>8.0</ele></trkpt>
    </trkseg>
  </trk>
  <trk>
    <name>Etappe 2: Winsum</name>
    <desc>Hotel nabij station</desc>
    <trkseg>
      <trkpt lat="53.3500" lon="6.4500"><ele>8.0</ele></trkpt>
      <trkpt lat="53.3000" lon="6.5000"><ele>10.0</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    it('detectsGpxTracks identifies multiple tracks and names', () => {
      const info = detectGpxTracks(multiTrackGpx);
      expect(info.hasMultipleStages).toBe(true);
      expect(info.trackCount).toBe(2);
      expect(info.trackNames).toEqual(['Etappe 1: Pieterburen', 'Etappe 2: Winsum']);
    });

    it('parseGpx preserves stages by default for multi-track files', () => {
      const route = parseGpx(multiTrackGpx);
      expect(route.stages).toHaveLength(2);
      expect(route.stages[0].title).toBe('Etappe 1: Pieterburen');
      expect(route.stages[0].notes).toBe('Overnachting op camping');
      expect(route.stages[1].title).toBe('Etappe 2: Winsum');
      expect(route.stages[1].notes).toBe('Hotel nabij station');
    });

    it('parseGpx merges segments into a single stage when mergeSegments option is true', () => {
      const route = parseGpx(multiTrackGpx, 'Merged Route', { mergeSegments: true });
      expect(route.stages).toHaveLength(1);
      expect(route.stages[0].title).toBe('Merged Route');
      expect(route.stages[0].coordinates.length).toBe(4);
    });

    it('serializeToGpx exports multi-stage route with separate trk elements', () => {
      const route = parseGpx(multiTrackGpx);
      const exportedGpx = serializeToGpx(route);

      expect(exportedGpx).toContain('<name>Etappe 1: Pieterburen</name>');
      expect(exportedGpx).toContain('<desc>Overnachting op camping</desc>');
      expect(exportedGpx).toContain('<name>Etappe 2: Winsum</name>');
      expect(exportedGpx).toContain('<desc>Hotel nabij station</desc>');
      expect(exportedGpx.match(/<trk>/g)?.length).toBe(2);
    });
  });

  describe('extractWaypointsPerStage', () => {
    it('extracts waypoints tagged with respective stageId', () => {
      const sampleRoute: HikeRoute = {
        id: 'route-multi',
        title: 'Multi Stage',
        totalDistanceKm: 20,
        stages: [
          {
            id: 's1',
            stageNumber: 1,
            title: 'E1',
            distanceKm: 10,
            coordinates: [{ lat: 52, lng: 5 }, { lat: 52.1, lng: 5.1 }],
          },
          {
            id: 's2',
            stageNumber: 2,
            title: 'E2',
            distanceKm: 10,
            coordinates: [{ lat: 52.1, lng: 5.1 }, { lat: 52.2, lng: 5.2 }],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const extracted = extractWaypointsPerStage(sampleRoute);
      expect(extracted.stages).toHaveLength(2);
      expect(extracted.waypoints.filter((w) => w.stageId === 's1')).toHaveLength(2);
      expect(extracted.waypoints.filter((w) => w.stageId === 's2')).toHaveLength(2);
    });
  });
});
