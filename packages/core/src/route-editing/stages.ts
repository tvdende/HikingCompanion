import type { Coordinate, HikeRoute, HikeStage, TransportType } from '../types/index.js';
import type { RouteWaypoint, RouteSegment, RouteStageDefinition } from '../types/route-planner.js';
import { calculateHaversineDistanceKm } from '../index.js';
import { calculateRouteMetrics } from '../gpx/metrics.js';

export interface StageMetrics {
  stageId: string;
  stageNumber: number;
  title: string;
  notes?: string;
  transportType: TransportType;
  distanceKm: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  waypointCount: number;
}

export interface RouteStagesBreakdown {
  stages: StageMetrics[];
  totalDistanceKm: number;
  hikingDistanceKm: number;
  transitDistanceKm: number;
  totalElevationGainMeters: number;
  totalElevationLossMeters: number;
}

function generateStageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `stage-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Splits a stage at a specific waypoint.
 * Waypoints up to splitWaypointIndex stay in current stage, waypoints from splitWaypointIndex move to a new stage.
 */
export function splitRouteAtWaypoint(
  stages: readonly RouteStageDefinition[],
  waypoints: readonly RouteWaypoint[],
  splitWaypointId: string
): {
  stages: RouteStageDefinition[];
  waypoints: RouteWaypoint[];
  newStageId: string;
} {
  const wpIndex = waypoints.findIndex((w) => w.id === splitWaypointId);
  if (wpIndex <= 0 || wpIndex >= waypoints.length) {
    throw new Error('Splitsen vereist een tussenliggend routepunt');
  }

  const splitWaypoint = waypoints[wpIndex];
  const targetStageId = splitWaypoint.stageId || (stages[0] ? stages[0].id : 'stage-1');
  const targetStageIdx = stages.findIndex((s) => s.id === targetStageId);
  const targetStageNumber = targetStageIdx >= 0 ? stages[targetStageIdx].stageNumber : 1;

  const newStageId = generateStageId();
  const newStageNumber = targetStageNumber + 1;

  const newStage: RouteStageDefinition = {
    id: newStageId,
    stageNumber: newStageNumber,
    title: `Etappe ${newStageNumber}`,
    transportType: 'foot',
  };

  // Create updated stages list, inserting newStage right after targetStage and renumbering
  const updatedStages: RouteStageDefinition[] = [];
  let insertPos = targetStageIdx >= 0 ? targetStageIdx + 1 : stages.length;

  const preStages = stages.slice(0, insertPos);
  const postStages = stages.slice(insertPos);

  const combinedStages = [...preStages, newStage, ...postStages];
  for (let i = 0; i < combinedStages.length; i++) {
    updatedStages.push({
      ...combinedStages[i],
      stageNumber: i + 1,
    });
  }

  // Assign waypoints from splitIndex onward (that were in targetStageId) to newStageId
  const updatedWaypoints = waypoints.map((wp, idx) => {
    if (idx >= wpIndex && (!wp.stageId || wp.stageId === targetStageId)) {
      return { ...wp, stageId: newStageId };
    }
    return wp;
  });

  return {
    stages: updatedStages,
    waypoints: updatedWaypoints,
    newStageId,
  };
}

/**
 * Merges a stage into its adjacent predecessor.
 * If stageId is the first stage and there's a subsequent stage, merges the subsequent into the first.
 */
export function mergeStages(
  stages: readonly RouteStageDefinition[],
  waypoints: readonly RouteWaypoint[],
  stageIdToMerge: string
): {
  stages: RouteStageDefinition[];
  waypoints: RouteWaypoint[];
  activeStageId: string;
} {
  if (stages.length <= 1) {
    return {
      stages: [...stages],
      waypoints: [...waypoints],
      activeStageId: stages[0]?.id || 'stage-1',
    };
  }

  const stageIdx = stages.findIndex((s) => s.id === stageIdToMerge);
  if (stageIdx < 0) {
    throw new Error(`Etappe niet gevonden: ${stageIdToMerge}`);
  }

  let absorbIntoStage: RouteStageDefinition;
  let stageToRemove: RouteStageDefinition;

  if (stageIdx > 0) {
    // Merge into predecessor
    absorbIntoStage = stages[stageIdx - 1];
    stageToRemove = stages[stageIdx];
  } else {
    // Stage is index 0: merge subsequent stage into stage 0
    absorbIntoStage = stages[0];
    stageToRemove = stages[1];
  }

  // Update waypoints
  const updatedWaypoints = waypoints.map((wp) => {
    if (wp.stageId === stageToRemove.id) {
      return { ...wp, stageId: absorbIntoStage.id };
    }
    return wp;
  });

  // Remove stage and renumber
  const remaining = stages.filter((s) => s.id !== stageToRemove.id);
  const updatedStages = remaining.map((s, idx) => ({
    ...s,
    stageNumber: idx + 1,
  }));

  return {
    stages: updatedStages,
    waypoints: updatedWaypoints,
    activeStageId: absorbIntoStage.id,
  };
}

/**
 * Reorders stages according to a new stage ID sequence.
 * Also reorders the waypoints array to maintain sequential stage order.
 */
export function reorderStages(
  stages: readonly RouteStageDefinition[],
  waypoints: readonly RouteWaypoint[],
  newStageOrder: readonly string[]
): {
  stages: RouteStageDefinition[];
  waypoints: RouteWaypoint[];
} {
  const stageMap = new Map(stages.map((s) => [s.id, s]));
  const orderedStages: RouteStageDefinition[] = [];

  newStageOrder.forEach((id, idx) => {
    const s = stageMap.get(id);
    if (s) {
      orderedStages.push({
        ...s,
        stageNumber: idx + 1,
      });
      stageMap.delete(id);
    }
  });

  // Append any unmentioned stages
  for (const s of stageMap.values()) {
    orderedStages.push({
      ...s,
      stageNumber: orderedStages.length + 1,
    });
  }

  // Group and reorder waypoints according to new stage sequence
  const waypointsByStage = new Map<string, RouteWaypoint[]>();
  for (const s of orderedStages) {
    waypointsByStage.set(s.id, []);
  }

  const unassignedWaypoints: RouteWaypoint[] = [];
  for (const wp of waypoints) {
    const stageId = wp.stageId || (orderedStages[0] ? orderedStages[0].id : 'stage-1');
    const list = waypointsByStage.get(stageId);
    if (list) {
      list.push({ ...wp, stageId });
    } else {
      unassignedWaypoints.push(wp);
    }
  }

  const reorderedWaypoints: RouteWaypoint[] = [];
  for (const s of orderedStages) {
    const list = waypointsByStage.get(s.id) || [];
    reorderedWaypoints.push(...list);
  }
  reorderedWaypoints.push(...unassignedWaypoints);

  return {
    stages: orderedStages,
    waypoints: reorderedWaypoints,
  };
}

/**
 * Deletes a stage and removes all waypoints assigned to that stage from the map.
 * Remaining stages are sequentially renumbered.
 */
export function deleteStageAndPoints(
  stages: readonly RouteStageDefinition[],
  waypoints: readonly RouteWaypoint[],
  stageIdToDelete: string
): {
  stages: RouteStageDefinition[];
  waypoints: RouteWaypoint[];
  activeStageId: string;
} {
  const updatedWaypoints = waypoints.filter((wp) => wp.stageId !== stageIdToDelete);
  const remainingStages = stages.filter((s) => s.id !== stageIdToDelete);

  if (remainingStages.length === 0) {
    const freshStageId = generateStageId();
    const freshStage: RouteStageDefinition = {
      id: freshStageId,
      stageNumber: 1,
      title: 'Etappe 1',
      transportType: 'foot',
    };
    return {
      stages: [freshStage],
      waypoints: [],
      activeStageId: freshStageId,
    };
  }

  const renumberedStages = remainingStages.map((s, idx) => ({
    ...s,
    stageNumber: idx + 1,
  }));

  return {
    stages: renumberedStages,
    waypoints: updatedWaypoints,
    activeStageId: renumberedStages[0].id,
  };
}

/**
 * Extracts waypoints and stage definitions from an existing HikeRoute (e.g. imported GPX),
 * preserving stage boundaries without collapsing all stages into one.
 */
export function extractWaypointsPerStage(
  route: HikeRoute,
  maxPointsPerStage = 8
): {
  stages: RouteStageDefinition[];
  waypoints: RouteWaypoint[];
} {
  if (!route.stages || route.stages.length === 0) {
    const defaultStageId = generateStageId();
    return {
      stages: [
        {
          id: defaultStageId,
          stageNumber: 1,
          title: 'Etappe 1',
          transportType: 'foot',
        },
      ],
      waypoints: [],
    };
  }

  const stageDefinitions: RouteStageDefinition[] = [];
  const extractedWaypoints: RouteWaypoint[] = [];

  route.stages.forEach((stage, sIdx) => {
    const stageId = stage.id || generateStageId();
    stageDefinitions.push({
      id: stageId,
      stageNumber: sIdx + 1,
      title: stage.title || `Etappe ${sIdx + 1}`,
      notes: stage.notes,
      transportType: stage.transportType || 'foot',
    });

    const coords = stage.coordinates || [];
    if (coords.length === 0) return;

    if (coords.length === 1) {
      extractedWaypoints.push({
        id: `wp-${sIdx}-0-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        coordinate: coords[0],
        routingMode: 'snap',
        name: `Start Etappe ${sIdx + 1}`,
        stageId,
      });
      return;
    }

    const targetCount = Math.min(coords.length, Math.max(2, maxPointsPerStage));
    const indices: number[] = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.round((i * (coords.length - 1)) / (targetCount - 1));
      if (indices.length === 0 || indices[indices.length - 1] !== idx) {
        indices.push(idx);
      }
    }

    indices.forEach((coordIdx, ptIdx) => {
      const isStart = ptIdx === 0;
      const isFinish = ptIdx === indices.length - 1;
      const label = isStart
        ? `Start Etappe ${sIdx + 1}`
        : isFinish
        ? `Finish Etappe ${sIdx + 1}`
        : `Etappe ${sIdx + 1} - Punt ${ptIdx + 1}`;

      extractedWaypoints.push({
        id: `wp-${sIdx}-${ptIdx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        coordinate: coords[coordIdx],
        routingMode: 'snap',
        name: label,
        stageId,
      });
    });
  });

  return {
    stages: stageDefinitions,
    waypoints: extractedWaypoints,
  };
}

/**
 * Calculates per-stage metrics and total breakdown (hiking vs transit km).
 */
export function calculateStageMetrics(
  stages: readonly RouteStageDefinition[],
  segments: readonly RouteSegment[],
  waypoints: readonly RouteWaypoint[]
): RouteStagesBreakdown {
  const stageMetrics: StageMetrics[] = [];
  let totalDistanceKm = 0;
  let hikingDistanceKm = 0;
  let transitDistanceKm = 0;
  let totalElevationGainMeters = 0;
  let totalElevationLossMeters = 0;

  for (const stage of stages) {
    const stageWaypoints = waypoints.filter(
      (w) => w.stageId === stage.id || (!w.stageId && stage.stageNumber === 1)
    );
    const stageWpIds = new Set(stageWaypoints.map((w) => w.id));

    // A segment belongs to this stage if both its from and to waypoints belong to this stage
    const stageSegments = segments.filter(
      (seg) => stageWpIds.has(seg.fromWaypointId) && stageWpIds.has(seg.toWaypointId)
    );

    let distMeters = 0;
    let gainMeters = 0;
    let lossMeters = 0;

    for (const seg of stageSegments) {
      distMeters += seg.distanceMeters || 0;
      gainMeters += seg.elevationGainMeters || 0;
      lossMeters += seg.elevationLossMeters || 0;
    }

    const distKm = Number((distMeters / 1000).toFixed(2));
    const transportType = stage.transportType || 'foot';

    totalDistanceKm += distKm;
    if (transportType === 'foot') {
      hikingDistanceKm += distKm;
    } else {
      transitDistanceKm += distKm;
    }

    totalElevationGainMeters += gainMeters;
    totalElevationLossMeters += lossMeters;

    stageMetrics.push({
      stageId: stage.id,
      stageNumber: stage.stageNumber,
      title: stage.title,
      notes: stage.notes,
      transportType,
      distanceKm: distKm,
      elevationGainMeters: Math.round(gainMeters),
      elevationLossMeters: Math.round(lossMeters),
      waypointCount: stageWaypoints.length,
    });
  }

  return {
    stages: stageMetrics,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    hikingDistanceKm: Number(hikingDistanceKm.toFixed(2)),
    transitDistanceKm: Number(transitDistanceKm.toFixed(2)),
    totalElevationGainMeters: Math.round(totalElevationGainMeters),
    totalElevationLossMeters: Math.round(totalElevationLossMeters),
  };
}
