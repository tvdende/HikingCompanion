import { describe, it, expect } from 'vitest';
import {
  stitchGpxRoutes,
  type HikeRoute,
} from '@hiking-companion/core';

describe('GPX Track Stitching Domain Utility', () => {
  const route1: HikeRoute = {
    id: 'route-1',
    title: 'Veluwe Dag 1',
    description: 'Etappe van Arnhem naar Otterlo',
    location: 'Gelderland',
    status: 'draft',
    priceEur: 1.5,
    totalDistanceKm: 15.2,
    stages: [
      {
        id: 'stage-1',
        stageNumber: 1,
        title: 'Arnhem - Otterlo',
        distanceKm: 15.2,
        coordinates: [
          { lat: 52.0, lng: 5.9, elevation: 25 },
          { lat: 52.05, lng: 5.85, elevation: 45 },
          { lat: 52.1, lng: 5.8, elevation: 30 },
        ],
      },
    ],
    elevationMetrics: {
      elevationGainMeters: 40,
      elevationLossMeters: 35,
    },
    createdAt: '2026-10-21T10:00:00Z',
    updatedAt: '2026-10-21T10:00:00Z',
  };

  const route2: HikeRoute = {
    id: 'route-2',
    title: 'Veluwe Dag 2',
    description: 'Etappe van Otterlo naar Kootwijk',
    location: 'Gelderland',
    status: 'draft',
    priceEur: 2.0,
    totalDistanceKm: 18.0,
    stages: [
      {
        id: 'stage-2',
        stageNumber: 1,
        title: 'Otterlo - Kootwijk',
        distanceKm: 18.0,
        coordinates: [
          { lat: 52.1, lng: 5.8, elevation: 30 }, // matches route1 endpoint
          { lat: 52.15, lng: 5.75, elevation: 50 },
          { lat: 52.18, lng: 5.7, elevation: 40 },
        ],
      },
    ],
    elevationMetrics: {
      elevationGainMeters: 55,
      elevationLossMeters: 45,
    },
    createdAt: '2026-10-21T11:00:00Z',
    updatedAt: '2026-10-21T11:00:00Z',
  };

  const routeWithGap: HikeRoute = {
    id: 'route-gap',
    title: 'Veluwe Dag 3',
    description: 'Start met fysieke afstand vanaf Kootwijk',
    status: 'definitive',
    priceEur: 0,
    totalDistanceKm: 10.0,
    stages: [
      {
        id: 'stage-3',
        stageNumber: 1,
        title: 'Kootwijk verder',
        distanceKm: 10.0,
        coordinates: [
          { lat: 52.25, lng: 5.65, elevation: 35 }, // ~10km away from route2 end
          { lat: 52.28, lng: 5.6, elevation: 30 },
        ],
      },
    ],
    createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  };

  it('handles empty route array gracefully', () => {
    const stitched = stitchGpxRoutes([]);
    expect(stitched.stages).toHaveLength(0);
    expect(stitched.totalDistanceKm).toBe(0);
    expect(stitched.status).toBe('draft');
  });

  it('returns cloned route when single route provided', () => {
    const stitched = stitchGpxRoutes([route1], 'Mijn Enkele Route');
    expect(stitched.title).toBe('Mijn Enkele Route');
    expect(stitched.stages).toHaveLength(1);
    expect(stitched.totalDistanceKm).toBe(route1.totalDistanceKm);
  });

  it('stitches two contiguous routes into a multi-stage route', () => {
    const stitched = stitchGpxRoutes([route1, route2]);
    expect(stitched.stages).toHaveLength(2);
    expect(stitched.stages[0].stageNumber).toBe(1);
    expect(stitched.stages[1].stageNumber).toBe(2);
    expect(stitched.title).toBe('Veluwe Dag 1 & Veluwe Dag 2');
    expect(stitched.location).toBe('Gelderland');
    expect(stitched.priceEur).toBe(3.5);
    expect(stitched.status).toBe('draft');
    expect(stitched.totalDistanceKm).toBeGreaterThan(20);
    expect(stitched.elevationMetrics?.elevationGainMeters).toBeGreaterThan(0);
  });

  it('bridges geodesic gap when consecutive routes have disconnected endpoints', () => {
    const stitched = stitchGpxRoutes([route2, routeWithGap]);
    expect(stitched.stages).toHaveLength(2);
    // Gap should have been bridged with intermediate points in stage 2
    expect(stitched.stages[1].coordinates.length).toBeGreaterThan(routeWithGap.stages[0].coordinates.length);
    expect(stitched.totalDistanceKm).toBeGreaterThan(20);
  });

  it('sets definitive status only when all input routes are definitive', () => {
    const def1: HikeRoute = { ...route1, status: 'definitive' };
    const def2: HikeRoute = { ...route2, status: 'definitive' };
    const stitched = stitchGpxRoutes([def1, def2]);
    expect(stitched.status).toBe('definitive');
  });
});
