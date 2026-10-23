import type { Coordinate, HikeRoute, HikeStage, RouteStatus } from '../types/index.js';
import { calculateRouteMetrics } from './metrics.js';
import { interpolateStraightLine } from '../route-editing/index.js';
import { calculateHaversineDistanceKm } from '../index.js';

export interface StitchGpxOptions {
  defaultTitle?: string;
  bridgeGaps?: boolean;
  gapMaxStepMeters?: number;
  /** When true, all stitched coordinates (including gap bridges) become one stage. */
  singleStage?: boolean;
}

/**
 * Stitches multiple HikeRoutes (e.g. uploaded GPX files) into a single cohesive route.
 * Preserves stage structure, bridges physical gaps between track endpoints, and reconciles metrics.
 */
export function stitchGpxRoutes(
  routes: HikeRoute[],
  options?: StitchGpxOptions | string
): HikeRoute {
  const opts: StitchGpxOptions =
    typeof options === 'string' ? { defaultTitle: options } : options || {};
  const bridgeGaps = opts.bridgeGaps ?? true;
  const gapMaxStepMeters = opts.gapMaxStepMeters ?? 100;

  if (!routes || routes.length === 0) {
    return {
      id: crypto.randomUUID(),
      title: opts.defaultTitle || 'Gecombineerde Route',
      totalDistanceKm: 0,
      stages: [],
      status: 'draft',
      priceEur: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (routes.length === 1 && !(opts.singleStage && routes[0].stages.length > 1)) {
    const single = routes[0];
    return {
      ...single,
      title: opts.defaultTitle || single.title,
      status: single.status || 'draft',
      priceEur: single.priceEur ?? 0,
      updatedAt: new Date().toISOString(),
    };
  }

  // Determine stitched title
  const title =
    opts.defaultTitle ||
    routes
      .map((r) => r.title)
      .filter(Boolean)
      .join(' & ');

  const stitchedStages: HikeStage[] = [];
  const allCoordinates: Coordinate[] = [];
  let globalStageCounter = 1;

  for (let rIdx = 0; rIdx < routes.length; rIdx++) {
    const route = routes[rIdx];

    for (let sIdx = 0; sIdx < route.stages.length; sIdx++) {
      const origStage = route.stages[sIdx];
      let stageCoords = [...origStage.coordinates];

      if (stageCoords.length === 0) continue;

      // Check if we need to bridge a gap from the previous stage
      if (allCoordinates.length > 0 && bridgeGaps) {
        const lastCoord = allCoordinates[allCoordinates.length - 1];
        const nextStartCoord = stageCoords[0];
        const gapKm = calculateHaversineDistanceKm(lastCoord, nextStartCoord);

        // If there is a physical gap greater than 5 meters (0.005 km), interpolate straight line connector
        if (gapKm > 0.005) {
          const bridgePoints = interpolateStraightLine(lastCoord, nextStartCoord, gapMaxStepMeters);
          // bridgePoints[0] is lastCoord, bridgePoints[last] is nextStartCoord
          // Intermediate connector points:
          const connector = bridgePoints.slice(1, -1);
          if (connector.length > 0) {
            stageCoords = [...connector, ...stageCoords];
          }
        }
      }

      const stageMetrics = calculateRouteMetrics(stageCoords);
      const stageNumber = globalStageCounter++;
      const stageTitle =
        origStage.title && origStage.title !== 'Etappe 1'
          ? origStage.title
          : `Etappe ${stageNumber}`;

      stitchedStages.push({
        id: crypto.randomUUID(),
        stageNumber,
        title: stageTitle,
        distanceKm: stageMetrics.totalDistanceKm,
        coordinates: stageCoords,
      });

      allCoordinates.push(...stageCoords);
    }
  }

  const overallMetrics = calculateRouteMetrics(allCoordinates);

  if (opts.singleStage && stitchedStages.length > 1) {
    const first = stitchedStages[0];
    stitchedStages.splice(0, stitchedStages.length, {
      id: first.id,
      stageNumber: 1,
      title: title || first.title,
      distanceKm: overallMetrics.totalDistanceKm,
      coordinates: [...allCoordinates],
    });
  }

  // Derive consolidated metadata
  const location = routes.find((r) => r.location)?.location;
  const description = routes
    .map((r) => r.description)
    .filter(Boolean)
    .join('\n\n---\n\n');
  const allDefinitive = routes.every((r) => r.status === 'definitive');
  const status: RouteStatus = allDefinitive ? 'definitive' : 'draft';
  const priceEur = routes.reduce((acc, r) => acc + (r.priceEur || 0), 0);

  return {
    id: crypto.randomUUID(),
    title: title || 'Gecombineerde Route',
    description: description || undefined,
    location: location || undefined,
    status,
    priceEur: Number(priceEur.toFixed(2)),
    totalDistanceKm: overallMetrics.totalDistanceKm,
    stages: stitchedStages,
    elevationMetrics: overallMetrics.elevationMetrics,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
