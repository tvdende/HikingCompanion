import type { Coordinate, RouteElevationMetrics } from '../types/index.js';
import { calculateHaversineDistanceKm } from '../index.js';

export interface CalculatedRouteMetrics {
  totalDistanceKm: number;
  elevationMetrics: RouteElevationMetrics;
  pointCount: number;
}

const ELEVATION_JITTER_THRESHOLD_METERS = 0.5;

/**
 * Calculates cumulative distance, elevation gain, and elevation loss for a series of coordinates.
 */
export function calculateRouteMetrics(coordinates: Coordinate[]): CalculatedRouteMetrics {
  if (!coordinates || coordinates.length === 0) {
    return {
      totalDistanceKm: 0,
      elevationMetrics: {
        elevationGainMeters: 0,
        elevationLossMeters: 0,
        minElevationMeters: undefined,
        maxElevationMeters: undefined,
      },
      pointCount: 0,
    };
  }

  let totalDistanceKm = 0;
  let elevationGainMeters = 0;
  let elevationLossMeters = 0;
  let minElevationMeters: number | undefined = undefined;
  let maxElevationMeters: number | undefined = undefined;

  let prevCoord: Coordinate | null = null;
  let prevElevation: number | null = null;

  for (let i = 0; i < coordinates.length; i++) {
    const coord = coordinates[i];

    // Distance calculation
    if (prevCoord) {
      totalDistanceKm += calculateHaversineDistanceKm(prevCoord, coord);
    }
    prevCoord = coord;

    // Elevation calculation
    if (typeof coord.elevation === 'number' && !isNaN(coord.elevation)) {
      if (minElevationMeters === undefined || coord.elevation < minElevationMeters) {
        minElevationMeters = coord.elevation;
      }
      if (maxElevationMeters === undefined || coord.elevation > maxElevationMeters) {
        maxElevationMeters = coord.elevation;
      }

      if (prevElevation !== null) {
        const delta = coord.elevation - prevElevation;
        if (Math.abs(delta) >= ELEVATION_JITTER_THRESHOLD_METERS) {
          if (delta > 0) {
            elevationGainMeters += delta;
          } else {
            elevationLossMeters += Math.abs(delta);
          }
          prevElevation = coord.elevation;
        }
      } else {
        prevElevation = coord.elevation;
      }
    }
  }

  return {
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    elevationMetrics: {
      elevationGainMeters: Math.round(elevationGainMeters),
      elevationLossMeters: Math.round(elevationLossMeters),
      minElevationMeters: minElevationMeters !== undefined ? Math.round(minElevationMeters) : undefined,
      maxElevationMeters: maxElevationMeters !== undefined ? Math.round(maxElevationMeters) : undefined,
    },
    pointCount: coordinates.length,
  };
}
