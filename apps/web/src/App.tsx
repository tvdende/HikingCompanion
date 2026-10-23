import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  AppMode,
  HikeRoute,
  HikeStage,
  Coordinate,
  RouteWaypoint,
  RouteSegment,
  RoutingMode,
  RouteStatus,
  RouteStageDefinition,
  SurfaceBreakdown,
} from '@hiking-companion/core';
import {
  parseGpx,
  detectGpxTracks,
  stitchGpxRoutes,
  serializeToGpx,
  interpolateStraightLine,
  insertWaypoint,
  deleteWaypoint,
  moveWaypoint,
  reverseWaypoints,
  calculateHaversineDistanceKm,
  extractWaypointsPerStage,
  splitRouteAtWaypoint,
  mergeStages,
  reorderStages,
  deleteStageAndPoints,
  calculateStageMetrics,
  calculateRouteMetrics,
  diffRouteSegments,
  createWaypointPairs,
  globalSegmentCache,
  parseBRouterMessages,
  calculateSurfaceBreakdown,
} from '@hiking-companion/core';
import { Header } from './components/Header';
import { MapCanvas } from './components/MapCanvas';
import { LoginModal } from './components/LoginModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { LandingPage } from './components/LandingPage';
import { RouteEditorToolbar } from './components/RouteEditorToolbar';
import { SaveRouteModal, type SaveRouteData } from './components/SaveRouteModal';
import { RouteLibraryModal } from './components/RouteLibraryModal';
import { RouteMetadataModal } from './components/RouteMetadataModal';
import { StageManagerPanel } from './components/StageManagerPanel';
import { GpxImportModal } from './components/GpxImportModal';
import { SurfaceBreakdownCard } from './components/SurfaceBreakdownCard';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './i18n';
import { useFeedback } from './context/FeedbackContext';
import { useLayoutTier } from './hooks/useLayoutTier';
import { ChevronDown, ChevronUp, Download, Plus } from 'lucide-react';

interface HistorySnapshot {
  waypoints: RouteWaypoint[];
  stages: RouteStageDefinition[];
  activeStageId: string | null;
}

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { t, formatPriceEur } = useTranslation();
  const feedback = useFeedback();
  const [mode, setMode] = useState<AppMode>('planner');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

  // Route & Multi-Stage State
  const [currentRoute, setCurrentRoute] = useState<HikeRoute | null>(null);
  const [activeSavedRouteId, setActiveSavedRouteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [routingMode, setRoutingMode] = useState<RoutingMode>('snap');
  const [stages, setStages] = useState<RouteStageDefinition[]>([
    { id: 'stage-1', stageNumber: 1, title: 'Etappe 1', transportType: 'foot' },
  ]);
  const [activeStageId, setActiveStageId] = useState<string | null>('stage-1');
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const segmentsRef = useRef<RouteSegment[]>([]);
  segmentsRef.current = segments;
  const committedSegmentsRef = useRef<RouteSegment[]>([]);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      waypoints: [],
      stages: [{ id: 'stage-1', stageNumber: 1, title: 'Etappe 1', transportType: 'foot' }],
      activeStageId: 'stage-1',
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [focusRouteTrigger, setFocusRouteTrigger] = useState(0);
  const [activeLayerMode, setActiveLayerMode] = useState<'stages' | 'surface'>('stages');
  const [isAnalyzingSurface, setIsAnalyzingSurface] = useState(false);

  // File Upload State & GPX Choice Modal
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingGpxPayload, setPendingGpxPayload] = useState<{
    files: File[];
    texts: string[];
  } | null>(null);
  const [gpxModalConfig, setGpxModalConfig] = useState<{
    isOpen: boolean;
    type: 'append-choice' | 'multi-track' | 'multi-file';
    trackCount: number;
  }>({
    isOpen: false,
    type: 'append-choice',
    trackCount: 1,
  });

  // Resizable Sidebar State with persistent localStorage
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hiking_planner_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 340 && parsed <= 680) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return 390;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const layoutTier = useLayoutTier();
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  // On medium screens the stored width is clamped visually without overwriting the stored value.
  const sidebarWidthCss =
    layoutTier === 'medium' ? `max(320px, min(${sidebarWidth}px, 45vw))` : `${sidebarWidth}px`;

  const handleAnalyzeSurface = async () => {
    if (!currentRoute) return;
    const walkingStages = currentRoute.stages.filter((stage) => stage.transportType === undefined || stage.transportType === 'foot');
    if (!walkingStages.some((stage) => stage.coordinates.length > 1)) return;
    setIsAnalyzingSurface(true);
    try {
      const response = await fetch('/api/routes/surface-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: walkingStages }),
      });
      if (!response.ok) throw new Error('Surface analysis failed');
      const data = await response.json() as { surfaceBreakdown: SurfaceBreakdown };
      setCurrentRoute((route) => route ? { ...route, surfaceBreakdown: data.surfaceBreakdown } : route);
    } finally {
      setIsAnalyzingSurface(false);
    }
  };

  const handleStartResizeSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minWidth = 340;
      const maxWidth = Math.min(680, window.innerWidth - 60);
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - 16));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      try {
        localStorage.setItem('hiking_planner_sidebar_width', sidebarWidth.toString());
      } catch {
        // Ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  // Calculate dynamic stage metrics (hiking vs transit breakdown)
  const stageMetrics = calculateStageMetrics(stages, segments, waypoints);

  // Helper to commit state changes to undo/redo history stack
  const applyStateUpdate = useCallback(
    (
      newWaypoints: RouteWaypoint[],
      newStages: RouteStageDefinition[] = stages,
      newActiveStageId: string | null = activeStageId
    ) => {
      setWaypoints(newWaypoints);
      setStages(newStages);
      setActiveStageId(newActiveStageId);

      const snapshot: HistorySnapshot = {
        waypoints: newWaypoints,
        stages: newStages,
        activeStageId: newActiveStageId,
      };

      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(snapshot);
      if (nextHistory.length > 50) nextHistory.shift();
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [stages, activeStageId, history, historyIndex]
  );

  // Skip route recalculation flag (e.g. when opening a pre-computed saved route or importing GPX)
  const skipRecalculateRef = useRef(false);

  // Recalculate route polyline & segments whenever waypoints, routing mode, or stages change
  useEffect(() => {
    if (skipRecalculateRef.current) {
      skipRecalculateRef.current = false;
      return;
    }

    // Cancel any previous in-flight calculation requests
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    let isCancelled = false;

    const applyRouteState = (computedSegments: RouteSegment[]) => {
      let totalMeters = 0;
      for (const seg of computedSegments) {
        totalMeters += seg.distanceMeters || 0;
      }

      const hikeStages: HikeStage[] = stages.map((stage) => {
        const stageWps = waypoints.filter(
          (w) => w.stageId === stage.id || (!w.stageId && stage.stageNumber === 1)
        );
        const stageCoords: Coordinate[] = [];

        if (stageWps.length === 1) {
          stageCoords.push(stageWps[0].coordinate);
        } else if (stageWps.length > 1) {
          const stageWpIds = new Set(stageWps.map((w) => w.id));
          const stageSegs = computedSegments.filter(
            (seg) => stageWpIds.has(seg.fromWaypointId) && stageWpIds.has(seg.toWaypointId)
          );

          stageSegs.forEach((seg, sIdx) => {
            if (sIdx === 0) {
              stageCoords.push(...seg.coordinates);
            } else {
              stageCoords.push(...seg.coordinates.slice(1));
            }
          });

          // Fallback: If segments didn't provide coordinates or routing failed, interpolate straight lines
          if (stageCoords.length < 2 && stageWps.length >= 2) {
            stageCoords.length = 0;
            for (let w = 0; w < stageWps.length - 1; w++) {
              const line = interpolateStraightLine(
                stageWps[w].coordinate,
                stageWps[w + 1].coordinate
              );
              if (w === 0) {
                stageCoords.push(...line);
              } else {
                stageCoords.push(...line.slice(1));
              }
            }
          } else if (stageCoords.length === 0 && stageWps.length === 1) {
            stageCoords.push(stageWps[0].coordinate);
          }
        }

        let stageDistMeters = 0;
        for (let c = 0; c < stageCoords.length - 1; c++) {
          stageDistMeters +=
            calculateHaversineDistanceKm(stageCoords[c], stageCoords[c + 1]) * 1000;
        }

        const stageMetrics = calculateRouteMetrics(stageCoords);

        return {
          id: stage.id,
          stageNumber: stage.stageNumber,
          title: stage.title,
          notes: stage.notes,
          transportType: stage.transportType || 'foot',
          distanceKm: Number((stageDistMeters / 1000).toFixed(2)),
          coordinates: stageCoords,
          elevationGainMeters: stageMetrics.elevationMetrics.elevationGainMeters,
          elevationLossMeters: stageMetrics.elevationMetrics.elevationLossMeters,
        };
      });

      const distKm = Number((totalMeters / 1000).toFixed(2));
      const allRouteCoords = hikeStages.flatMap((s) => s.coordinates);
      const overallMetrics = calculateRouteMetrics(allRouteCoords);

      setCurrentRoute((prev) => ({
        id: activeSavedRouteId || 'active-route',
        title: prev?.title || t('planner.defaultRouteTitle'),
        description: prev?.description,
        location: prev?.location,
        status: prev?.status || 'draft',
        priceEur: prev?.priceEur ?? 0,
        totalDistanceKm: distKm,
        stages: hikeStages,
        elevationMetrics: overallMetrics.elevationMetrics,
        surfaceBreakdown: (() => {
          const surfaceSegments = computedSegments.flatMap((segment) => {
            const stageId = waypoints.find((waypoint) => waypoint.id === segment.fromWaypointId)?.stageId || 'stage-1';
            return parseBRouterMessages(segment.surfaceMessages ?? [], segment.coordinates, stageId);
          });
          return surfaceSegments.length > 0 ? calculateSurfaceBreakdown(surfaceSegments) : undefined;
        })(),
        createdAt: prev?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    };

    const updateRoute = async () => {
      if (waypoints.length === 0) {
        setSegments([]);
        committedSegmentsRef.current = [];
        setCurrentRoute(null);
        return;
      }

      if (waypoints.length === 1) {
        setSegments([]);
        committedSegmentsRef.current = [];
        const singlePt = waypoints[0].coordinate;
        const targetStageId = waypoints[0].stageId || stages[0]?.id || 'stage-1';

        const updatedStages: HikeStage[] = stages.map((s) => ({
          id: s.id,
          stageNumber: s.stageNumber,
          title: s.title,
          notes: s.notes,
          transportType: s.transportType || 'foot',
          distanceKm: 0,
          coordinates: s.id === targetStageId ? [singlePt] : [],
        }));

        setCurrentRoute((prev) => ({
          id: activeSavedRouteId || 'active-route',
          title: prev?.title || t('planner.defaultRouteTitle'),
          description: prev?.description,
          location: prev?.location,
          status: prev?.status || 'draft',
          priceEur: prev?.priceEur ?? 0,
          totalDistanceKm: 0,
          stages: updatedStages,
          elevationMetrics: { elevationGainMeters: 0, elevationLossMeters: 0 },
          createdAt: prev?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        return;
      }

      // 1. Create target waypoint pairs and diff against existing committed segments
      const targetPairs = createWaypointPairs(waypoints, routingMode);
      const { retainedSegments, dirtyPairs } = diffRouteSegments(
        committedSegmentsRef.current,
        targetPairs
      );

      const resolvedSegments: RouteSegment[] = new Array(targetPairs.length);
      retainedSegments.forEach((seg, idx) => {
        resolvedSegments[idx] = seg;
      });

      // 2. Classify dirty pairs into direct mode / cache hits vs network fetches
      const needsFetch: typeof targetPairs = [];

      for (const pair of dirtyPairs) {
        const mode = pair.routingMode;
        if (mode === 'direct') {
          const directCoords = interpolateStraightLine(pair.from.coordinate, pair.to.coordinate);
          const directDist =
            calculateHaversineDistanceKm(pair.from.coordinate, pair.to.coordinate) * 1000;
          const directMetrics = calculateRouteMetrics(directCoords);
          const directSeg: RouteSegment = {
            id: `seg-${pair.from.id}-${pair.to.id}`,
            fromWaypointId: pair.from.id,
            toWaypointId: pair.to.id,
            routingMode: 'direct',
            coordinates: directCoords,
            distanceMeters: directDist,
            elevationGainMeters: directMetrics.elevationMetrics.elevationGainMeters,
            elevationLossMeters: directMetrics.elevationMetrics.elevationLossMeters,
          };
          globalSegmentCache.set(pair.from.coordinate, pair.to.coordinate, 'direct', {
            coordinates: directCoords,
            distanceMeters: directDist,
            elevationGainMeters: directMetrics.elevationMetrics.elevationGainMeters,
            elevationLossMeters: directMetrics.elevationMetrics.elevationLossMeters,
          });
          resolvedSegments[pair.index] = directSeg;
        } else {
          // Check segment cache (supports forward & reverse bidirectional matching)
          const cached = globalSegmentCache.get(pair.from.coordinate, pair.to.coordinate, mode);
          if (cached) {
            const segMetrics = calculateRouteMetrics(cached.coordinates);
            resolvedSegments[pair.index] = {
              id: `seg-${pair.from.id}-${pair.to.id}`,
              fromWaypointId: pair.from.id,
              toWaypointId: pair.to.id,
              routingMode: mode,
              coordinates: cached.coordinates,
              distanceMeters: cached.distanceMeters,
              elevationGainMeters:
                cached.elevationGainMeters ?? segMetrics.elevationMetrics.elevationGainMeters,
              elevationLossMeters:
                cached.elevationLossMeters ?? segMetrics.elevationMetrics.elevationLossMeters,
            };
          } else {
            needsFetch.push(pair);
          }
        }
      }

      // 3. If all segments are retained or resolved from cache, update immediately (0ms delay)
      if (needsFetch.length === 0) {
        committedSegmentsRef.current = resolvedSegments;
        setSegments(resolvedSegments);
        applyRouteState(resolvedSegments);
        setIsCalculating(false);
        return;
      }

      // 4. Optimistic UI preview: render straight line for pending segments with 0ms visual latency
      const optimisticSegments = [...resolvedSegments];
      for (const pair of needsFetch) {
        const optCoords = interpolateStraightLine(pair.from.coordinate, pair.to.coordinate);
        const optDist =
          calculateHaversineDistanceKm(pair.from.coordinate, pair.to.coordinate) * 1000;
        const optMetrics = calculateRouteMetrics(optCoords);
        optimisticSegments[pair.index] = {
          id: `seg-${pair.from.id}-${pair.to.id}`,
          fromWaypointId: pair.from.id,
          toWaypointId: pair.to.id,
          routingMode: pair.routingMode,
          coordinates: optCoords,
          distanceMeters: optDist,
          elevationGainMeters: optMetrics.elevationMetrics.elevationGainMeters,
          elevationLossMeters: optMetrics.elevationMetrics.elevationLossMeters,
        };
      }
      setSegments(optimisticSegments);
      applyRouteState(optimisticSegments);
      setIsCalculating(true);

      // 5. Parallel concurrent fetching with Promise.all and isolated try/catch per segment
      try {
        const fetchPromises = needsFetch.map(async (pair) => {
          let segmentCoords: Coordinate[] = [];
          let segmentDistMeters = 0;
          let isFallback = false;

          try {
            const res = await fetch('/api/routing/route', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                coordinates: [
                  [pair.from.coordinate.lng, pair.from.coordinate.lat],
                  [pair.to.coordinate.lng, pair.to.coordinate.lat],
                ],
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.coordinates && data.coordinates.length > 0 && !data.isFallback) {
                segmentCoords = data.coordinates.map((item: any) => {
                  if (Array.isArray(item)) {
                    return { lng: item[0], lat: item[1] };
                  }
                  return { lng: item.lng, lat: item.lat, elevation: item.elevation };
                });
                segmentDistMeters =
                  data.distanceMeters ||
                  calculateHaversineDistanceKm(pair.from.coordinate, pair.to.coordinate) * 1000;
                const surfaceMessages = Array.isArray(data.surfaceMessages) ? data.surfaceMessages as string[][] : undefined;
                (pair as typeof pair & { surfaceMessages?: string[][] }).surfaceMessages = surfaceMessages;
              } else {
                isFallback = true;
                segmentCoords = interpolateStraightLine(pair.from.coordinate, pair.to.coordinate);
                segmentDistMeters =
                  calculateHaversineDistanceKm(pair.from.coordinate, pair.to.coordinate) * 1000;
              }
            } else {
              isFallback = true;
              segmentCoords = interpolateStraightLine(pair.from.coordinate, pair.to.coordinate);
              segmentDistMeters =
                calculateHaversineDistanceKm(pair.from.coordinate, pair.to.coordinate) * 1000;
            }
          } catch (err: any) {
            if (err?.name === 'AbortError') {
              throw err;
            }
            isFallback = true;
            segmentCoords = interpolateStraightLine(pair.from.coordinate, pair.to.coordinate);
            segmentDistMeters =
              calculateHaversineDistanceKm(pair.from.coordinate, pair.to.coordinate) * 1000;
          }

          const segMetrics = calculateRouteMetrics(segmentCoords);

          // Only cache in globalSegmentCache if trail snapping succeeded or routingMode is 'direct'
          if (!isFallback || pair.routingMode === 'direct') {
            globalSegmentCache.set(pair.from.coordinate, pair.to.coordinate, pair.routingMode, {
              coordinates: segmentCoords,
              distanceMeters: segmentDistMeters,
              elevationGainMeters: segMetrics.elevationMetrics.elevationGainMeters,
              elevationLossMeters: segMetrics.elevationMetrics.elevationLossMeters,
            });
          }

          const seg: RouteSegment = {
            id: `seg-${pair.from.id}-${pair.to.id}`,
            fromWaypointId: pair.from.id,
            toWaypointId: pair.to.id,
            routingMode: pair.routingMode,
            coordinates: segmentCoords,
            distanceMeters: segmentDistMeters,
            elevationGainMeters: segMetrics.elevationMetrics.elevationGainMeters,
            elevationLossMeters: segMetrics.elevationMetrics.elevationLossMeters,
            surfaceMessages: (pair as typeof pair & { surfaceMessages?: string[][] }).surfaceMessages,
          };

          return { index: pair.index, segment: seg };
        });

        const fetchedResults = await Promise.all(fetchPromises);

        if (isCancelled || controller.signal.aborted) return;

        for (const item of fetchedResults) {
          resolvedSegments[item.index] = item.segment;
        }

        committedSegmentsRef.current = resolvedSegments;
        setSegments(resolvedSegments);
        applyRouteState(resolvedSegments);
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.error('Error calculating route segments:', err);
      } finally {
        if (!isCancelled && !controller.signal.aborted) {
          setIsCalculating(false);
        }
      }
    };

    updateRoute();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [waypoints, stages, routingMode, activeSavedRouteId, t]);

  // Editor Waypoint Actions
  const handleAddWaypoint = (coord: Coordinate) => {
    const currentStageId = activeStageId || stages[0]?.id || 'stage-1';
    const newWp: RouteWaypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      coordinate: coord,
      routingMode,
      stageId: currentStageId,
    };
    applyStateUpdate([...waypoints, newWp], stages, currentStageId);
  };

  const handleMoveWaypoint = (wpId: string, newCoord: Coordinate) => {
    const updated = moveWaypoint(waypoints, wpId, newCoord);
    applyStateUpdate(updated, stages, activeStageId);
  };

  const handleDeleteWaypoint = (wpId: string) => {
    const updated = deleteWaypoint(waypoints, wpId);
    applyStateUpdate(updated, stages, activeStageId);
  };

  const handleInsertWaypoint = (index: number, coord: Coordinate) => {
    const inheritedStageId =
      waypoints[Math.max(0, index - 1)]?.stageId || activeStageId || stages[0]?.id || 'stage-1';

    const newWp: RouteWaypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      coordinate: coord,
      routingMode,
      stageId: inheritedStageId,
    };
    const updated = insertWaypoint(waypoints, newWp, index);
    applyStateUpdate(updated, stages, activeStageId);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const snapshot = history[newIdx];
      setWaypoints(snapshot.waypoints);
      setStages(snapshot.stages);
      setActiveStageId(snapshot.activeStageId);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const snapshot = history[newIdx];
      setWaypoints(snapshot.waypoints);
      setStages(snapshot.stages);
      setActiveStageId(snapshot.activeStageId);
    }
  };

  const handleReverse = () => {
    if (waypoints.length < 2) return;
    const reversed = reverseWaypoints(waypoints);
    applyStateUpdate(reversed, stages, activeStageId);
  };

  const handleClear = () => {
    skipRecalculateRef.current = true;
    const freshStage: RouteStageDefinition = {
      id: 'stage-1',
      stageNumber: 1,
      title: t('planner.stageDefaultTitle', { number: 1 }),
      transportType: 'foot',
    };
    setWaypoints([]);
    setSegments([]);
    committedSegmentsRef.current = [];
    globalSegmentCache.clear();
    setStages([freshStage]);
    setActiveStageId('stage-1');
    setHistory([{ waypoints: [], stages: [freshStage], activeStageId: 'stage-1' }]);
    setHistoryIndex(0);
    setCurrentRoute(null);
    setActiveSavedRouteId(null);
  };

  // Stage Management Actions
  const handleSplitStage = (waypointId: string) => {
    try {
      const result = splitRouteAtWaypoint(stages, waypoints, waypointId);
      applyStateUpdate(result.waypoints, result.stages, result.newStageId);
      feedback.success(t('feedback.stageSplit'));
    } catch (err: unknown) {
      feedback.error(err instanceof Error ? err.message : t('stages.splitError'));
    }
  };

  const handleMergeStage = (stageId: string) => {
    try {
      const result = mergeStages(stages, waypoints, stageId);
      applyStateUpdate(result.waypoints, result.stages, result.activeStageId);
      feedback.success(t('feedback.stageMerged'));
    } catch (err: unknown) {
      feedback.error(err instanceof Error ? err.message : t('stages.mergeError'));
    }
  };

  const handleReorderStages = (newOrder: string[]) => {
    const result = reorderStages(stages, waypoints, newOrder);
    applyStateUpdate(result.waypoints, result.stages, activeStageId);
  };

  const handleDeleteStage = (stageId: string) => {
    const result = deleteStageAndPoints(stages, waypoints, stageId);
    applyStateUpdate(result.waypoints, result.stages, result.activeStageId);
  };

  const handleAddStage = () => {
    const nextNum = stages.length + 1;
    const newStageId = `stage-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStage: RouteStageDefinition = {
      id: newStageId,
      stageNumber: nextNum,
      title: t('planner.stageDefaultTitle', { number: nextNum }),
      transportType: 'foot',
    };
    applyStateUpdate(waypoints, [...stages, newStage], newStageId);
  };

  const handleUpdateStageMetadata = (
    stageId: string,
    updates: Partial<RouteStageDefinition>
  ) => {
    const updated = stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s));
    applyStateUpdate(waypoints, updated, activeStageId);
  };

  const handleSelectStage = (stageId: string) => {
    setActiveStageId(stageId);
  };

  const handleZoomFullRoute = () => {
    setActiveStageId(null);
    setFocusRouteTrigger((prev) => prev + 1);
  };

  // Route Persistence Actions
  const handleSaveRoute = async (saveData: SaveRouteData) => {
    if (!currentRoute) return;

    const payload = {
      title: saveData.title,
      description: saveData.description,
      location: saveData.location,
      status: saveData.status || 'draft',
      priceEur: saveData.priceEur ?? 0,
      totalDistanceKm: currentRoute.totalDistanceKm,
      coordinates: currentRoute.stages.flatMap((s) => s.coordinates || []),
      stages: currentRoute.stages,
      elevationMetrics: currentRoute.elevationMetrics,
      surfaceBreakdown: currentRoute.surfaceBreakdown,
      waypoints,
    };

    const isExisting = Boolean(activeSavedRouteId);
    const url = isExisting ? `/api/routes/${activeSavedRouteId}` : '/api/routes';
    const method = isExisting ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || t('saveModal.errSaveFailed'));
    }

    const data = await res.json();
    setActiveSavedRouteId(data.route.id);
    setCurrentRoute((prev) =>
      prev
        ? {
            ...prev,
            id: data.route.id,
            title: saveData.title,
            description: saveData.description,
            location: saveData.location,
            status: saveData.status || 'draft',
            priceEur: saveData.priceEur ?? 0,
            surfaceBreakdown: data.route.surfaceBreakdown || prev.surfaceBreakdown,
          }
        : null
    );
    feedback.success(t(isExisting ? 'feedback.routeUpdated' : 'feedback.routeSaved', { title: saveData.title }));
  };

  const handleLoadSavedRoute = async (routeId: string) => {
    const res = await fetch(`/api/routes/${routeId}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(t('libraryModal.loadError'));
    }

    const data = await res.json();
    const r = data.route;

    const loadedRoute: HikeRoute = {
      id: r.id,
      title: r.title,
      description: r.description,
      location: r.location,
      status: r.status as RouteStatus,
      priceEur: r.priceEur,
      totalDistanceKm: r.totalDistanceKm,
      stages: r.stages || [
        {
          id: 'stage-1',
          stageNumber: 1,
          title: r.title,
          distanceKm: r.totalDistanceKm,
          coordinates: r.coordinates || [],
        },
      ],
      elevationMetrics: r.elevationMetrics,
      surfaceBreakdown: r.surfaceBreakdown || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };

    skipRecalculateRef.current = true;
    setCurrentRoute(loadedRoute);
    setActiveSavedRouteId(r.id);
    setFocusRouteTrigger((prev) => prev + 1);

    const { stages: extractedStages, waypoints: extractedWps } =
      extractWaypointsPerStage(loadedRoute);

    setStages(extractedStages);
    setActiveStageId(extractedStages[0]?.id || 'stage-1');
    setWaypoints(extractedWps);
    setHistory([
      {
        waypoints: extractedWps,
        stages: extractedStages,
        activeStageId: extractedStages[0]?.id || 'stage-1',
      },
    ]);
    setHistoryIndex(0);
    setIsEditing(false);
  };

  // GPX Import Processing Engine
  const executeGpxProcessing = (
    files: File[],
    texts: string[],
    strategy: 'append-active' | 'new-stage' | 'separate-stages' | 'merged-single'
  ) => {
    try {
      const mergeSegments = strategy === 'merged-single';
      const parsedRoutes: HikeRoute[] = [];

      files.forEach((file, idx) => {
        const text = texts[idx];
        const defaultTitle = file.name.replace(/\.gpx$/i, '');
        parsedRoutes.push(parseGpx(text, defaultTitle, { mergeSegments }));
      });

      let finalRoute: HikeRoute;
      if (parsedRoutes.length === 1) {
        finalRoute = parsedRoutes[0];
      } else {
        finalRoute = stitchGpxRoutes(parsedRoutes);
      }

      if (strategy === 'append-active' && currentRoute) {
        // Append points from finalRoute to active stage
        const { waypoints: newWps } = extractWaypointsPerStage(finalRoute);
        const currentTargetStageId = activeStageId || stages[0]?.id || 'stage-1';
        const taggedWps = newWps.map((w) => ({ ...w, stageId: currentTargetStageId }));

        applyStateUpdate([...waypoints, ...taggedWps], stages, currentTargetStageId);
        setFocusRouteTrigger((prev) => prev + 1);
        setIsEditing(true);
        return;
      }

      if (
        (strategy === 'new-stage' || (strategy === 'separate-stages' && currentRoute)) &&
        currentRoute
      ) {
        // Add as separate new stages preserving existing stages
        const existingStages = [...stages];
        const newStagesList: RouteStageDefinition[] = [...existingStages];
        const allNewTaggedWps: RouteWaypoint[] = [];

        const { stages: extractedStages, waypoints: extractedWps } =
          extractWaypointsPerStage(finalRoute);

        extractedStages.forEach((extStage, idx) => {
          const nextNum = newStagesList.length + 1;
          const stageId =
            extStage.id ||
            `stage-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
          newStagesList.push({
            id: stageId,
            stageNumber: nextNum,
            title: extStage.title || `Etappe ${nextNum}`,
            notes: extStage.notes,
            transportType: extStage.transportType || 'foot',
          });

          const stageWps = extractedWps.filter((w) => w.stageId === extStage.id);
          allNewTaggedWps.push(...stageWps.map((w) => ({ ...w, stageId })));
        });

        // Also update currentRoute directly with the new stages and their coordinates
        const updatedCurrentStages: HikeStage[] = [
          ...currentRoute.stages,
          ...finalRoute.stages.map((s, idx) => ({
            ...s,
            stageNumber: currentRoute.stages.length + 1 + idx,
            id: newStagesList[existingStages.length + idx]?.id || s.id,
          })),
        ];

        skipRecalculateRef.current = true;
        setCurrentRoute({
          ...currentRoute,
          stages: updatedCurrentStages,
          totalDistanceKm: Number(
            (currentRoute.totalDistanceKm + finalRoute.totalDistanceKm).toFixed(2)
          ),
        });

        applyStateUpdate(
          [...waypoints, ...allNewTaggedWps],
          newStagesList,
          newStagesList[existingStages.length]?.id || activeStageId
        );
        setFocusRouteTrigger((prev) => prev + 1);
        setIsEditing(true);
        return;
      }

      // Default / fresh import: separate stages or single merged stage
      skipRecalculateRef.current = true;
      setCurrentRoute(finalRoute);
      setActiveSavedRouteId(null);
      setFocusRouteTrigger((prev) => prev + 1);

      const { stages: extractedStages, waypoints: extractedWps } =
        extractWaypointsPerStage(finalRoute);

      setStages(extractedStages);
      setActiveStageId(extractedStages[0]?.id || 'stage-1');
      setWaypoints(extractedWps);
      setHistory([
        {
          waypoints: extractedWps,
          stages: extractedStages,
          activeStageId: extractedStages[0]?.id || 'stage-1',
        },
      ]);
      setHistoryIndex(0);
      setIsEditing(true);
    } catch (err: any) {
      console.error('GPX parse error:', err);
      setFileError(err.message || t('planner.errorGpxProcess'));
    }
  };

  const handleGpxFiles = async (files: File[], append = false) => {
    if (!files || files.length === 0) return;
    setFileError(null);

    try {
      const texts: string[] = [];
      for (const file of files) {
        texts.push(await file.text());
      }

      // Check if user has an existing active route
      if (!append && waypoints.length > 0 && currentRoute) {
        setPendingGpxPayload({ files, texts });
        setGpxModalConfig({
          isOpen: true,
          type: files.length > 1 ? 'multi-file' : 'append-choice',
          trackCount: files.length,
        });
        return;
      }

      // Check if multiple files uploaded without active route
      if (files.length > 1) {
        setPendingGpxPayload({ files, texts });
        setGpxModalConfig({
          isOpen: true,
          type: 'multi-file',
          trackCount: files.length,
        });
        return;
      }

      // Check if single file has multiple track segments
      if (files.length === 1) {
        const info = detectGpxTracks(texts[0]);
        if (info.hasMultipleStages) {
          setPendingGpxPayload({ files, texts });
          setGpxModalConfig({
            isOpen: true,
            type: 'multi-track',
            trackCount: info.trackCount || info.segmentCount,
          });
          return;
        }
      }

      executeGpxProcessing(files, texts, append ? 'append-active' : 'separate-stages');
    } catch (err: any) {
      console.error('GPX reading error:', err);
      setFileError(err.message || t('planner.errorGpxProcess'));
    }
  };

  const handleGpxModalChoice = (
    choice: 'append-active' | 'new-stage' | 'separate-stages' | 'merged-single'
  ) => {
    setGpxModalConfig((prev) => ({ ...prev, isOpen: false }));
    if (!pendingGpxPayload) return;

    executeGpxProcessing(
      pendingGpxPayload.files,
      pendingGpxPayload.texts,
      choice
    );
    setPendingGpxPayload(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleGpxFiles(files, isAppendMode);
    }
    setIsAppendMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith('.gpx') || f.type.includes('xml')
    );
    if (files.length > 0) {
      handleGpxFiles(files, false);
    } else {
      setFileError(t('planner.errorGpxOnly'));
    }
  };

  const triggerAppendGpx = () => {
    setIsAppendMode(true);
    fileInputRef.current?.click();
  };

  const triggerNewGpx = () => {
    setIsAppendMode(false);
    fileInputRef.current?.click();
  };

  const handleExportGpx = () => {
    if (!currentRoute) return;
    try {
      const gpxContent = serializeToGpx(currentRoute);
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentRoute.title.replace(/[/\\?%*:|"<>]/g, '-')}.gpx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      feedback.success(t('feedback.exportStarted', { title: currentRoute.title }));
    } catch (err) {
      console.error('Failed to export GPX:', err);
      feedback.error(t('planner.errorGpxExport'));
    }
  };

  return (
    <div
      id="app-root"
      className="app-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header
        currentMode={mode}
        onModeChange={setMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Guest View: Landing Page & Feature Showcase */}
      {!isLoading && !user && <LandingPage onOpenLogin={() => setIsLoginModalOpen(true)} />}

      {/* Authenticated View: Map & Planning Workspace */}
      {!isLoading && user && (
        <>
          <input
            id="gpx-file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept=".gpx,application/gpx+xml,text/xml"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />

          <main
            className="main-viewport"
            data-layout-tier={layoutTier}
            data-planner-sheet={mode === 'planner' && layoutTier === 'compact' ? (isSheetExpanded ? 'expanded' : 'collapsed') : undefined}
            style={{ '--planner-sidebar-width': mode === 'planner' ? sidebarWidthCss : '0px' } as React.CSSProperties}
          >
            {/* Interactive Route Editor Toolbar (Planner Mode) */}
            {mode === 'planner' && (
              <RouteEditorToolbar
                isEditing={isEditing}
                onToggleEditing={() => setIsEditing((prev) => !prev)}
                routingMode={routingMode}
                onToggleRoutingMode={setRoutingMode}
                canUndo={historyIndex > 0}
                onUndo={handleUndo}
                canRedo={historyIndex < history.length - 1}
                onRedo={handleRedo}
                onReverse={handleReverse}
                onSave={() => setIsSaveModalOpen(true)}
                onOpenLibrary={() => setIsLibraryModalOpen(true)}
                onOpenMetadata={() => setIsMetadataModalOpen(true)}
                onClear={handleClear}
                onCenterRoute={handleZoomFullRoute}
                hasRoute={Boolean(currentRoute && currentRoute.stages.length > 0)}
                waypointCount={waypoints.length}
                isCalculating={isCalculating}
                layoutTier={layoutTier}
              />
            )}

            <MapCanvas
              route={currentRoute}
              waypoints={waypoints}
              stages={stages}
              activeStageId={activeStageId}
              isEditing={isEditing}
              focusRouteTrigger={focusRouteTrigger}
              sidebarWidth={sidebarWidth}
              activeLayerMode={activeLayerMode}
              onAddWaypoint={handleAddWaypoint}
              onMoveWaypoint={handleMoveWaypoint}
              onDeleteWaypoint={handleDeleteWaypoint}
              onInsertWaypoint={handleInsertWaypoint}
              onSplitStage={handleSplitStage}
              onMergeStage={handleMergeStage}
              onSelectStage={handleSelectStage}
            />

            {isDraggingFile && (
              <div id="drop-zone-overlay" className="drag-drop-overlay">
                <div className="drop-zone-card">
                  <span className="drop-icon">📂</span>
                  <h3>{t('planner.dropZoneTitle')}</h3>
                  <p>{t('planner.dropZoneSubtitle')}</p>
                </div>
              </div>
            )}

            {/* Planner Mode Overlay Panel */}
            {mode === 'planner' && (
              <aside
                id="planner-panel"
                className="planner-sidebar"
                aria-label={t('planner.sidebarTitle')}
                style={{ width: sidebarWidthCss }}
              >
                {layoutTier === 'compact' && (
                  <button
                    id="planner-sheet-toggle"
                    type="button"
                    className="planner-sheet-toggle"
                    onClick={() => setIsSheetExpanded((prev) => !prev)}
                    aria-expanded={isSheetExpanded}
                    aria-controls="planner-panel"
                    aria-label={isSheetExpanded ? t('planner.sheetCollapse') : t('planner.sheetExpand')}
                    title={isSheetExpanded ? t('planner.sheetCollapse') : t('planner.sheetExpand')}
                  >
                    <span className="planner-sheet-grip" aria-hidden="true" />
                    {isSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                )}

                {/* Drag-to-resize handle */}
                <div
                  className={`sidebar-resizer ${isResizingSidebar ? 'is-resizing' : ''}`}
                  onMouseDown={handleStartResizeSidebar}
                  title={t('stages.resizeSidebarTooltip')}
                  aria-label={t('stages.resizeSidebarTooltip')}
                >
                  <div className="resizer-pill" />
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#1b261e]">
                    {t('planner.sidebarTitle')}
                  </h2>
                  <Badge variant="secondary">
                    {t('planner.desktopModeBadge')}
                  </Badge>
                </div>

                {fileError && (
                  <div id="gpx-error-banner" className="gpx-error-banner">
                    ⚠️ {fileError}
                  </div>
                )}

                {currentRoute ? (
                  <div id="loaded-route-card" className="route-summary-card">
                    <div className="route-header-row">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="default">{t('planner.activeRouteBadge')}</Badge>
                          <Badge
                            id="active-route-status-badge"
                            variant={currentRoute.status === 'definitive' ? 'success' : 'secondary'}
                          >
                            {currentRoute.status === 'definitive'
                              ? t('planner.statusDefinitiveBadge')
                              : t('planner.statusDraftBadge')}
                          </Badge>
                          {currentRoute.priceEur !== undefined && currentRoute.priceEur > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f4f3ef] text-[#1b261e] font-semibold border border-[#e5e2da]">
                              {formatPriceEur(currentRoute.priceEur)}
                            </span>
                          )}
                        </div>
                        <h3 id="route-title" className="route-card-title">
                          {currentRoute.title}
                        </h3>
                        {currentRoute.location && (
                          <p className="text-xs text-[#576359] m-0 mt-0.5">
                            📍 {currentRoute.location}
                          </p>
                        )}
                      </div>
                      <button
                        id="btn-clear-route"
                        type="button"
                        className="clear-route-btn"
                        onClick={handleClear}
                        title={t('planner.closeRouteTooltip')}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="trail-stats-grid">
                      <div className="trail-stat-box">
                        <span className="stat-label">{t('planner.statDistance')}</span>
                        <span id="stat-total-distance" className="stat-num">
                          {currentRoute.totalDistanceKm} {t('common.km')}
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">{t('planner.statGain')}</span>
                        <span id="stat-elevation-gain" className="stat-num text-gain">
                          +{currentRoute.elevationMetrics?.elevationGainMeters ?? 0} {t('common.m')}
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">{t('planner.statLoss')}</span>
                        <span id="stat-elevation-loss" className="stat-num text-loss">
                          -{currentRoute.elevationMetrics?.elevationLossMeters ?? 0} {t('common.m')}
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">{t('planner.statStages')}</span>
                        <span id="stat-stage-count" className="stat-num">
                          {stages.length}
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">{t('planner.statPoints')}</span>
                        <span id="stat-point-count" className="stat-num">
                          {waypoints.length > 0
                            ? `${waypoints.length} ${t('common.wps')}`
                            : `${currentRoute.stages.reduce(
                                (acc: number, s) => acc + s.coordinates.length,
                                0
                              )} ${t('common.pts')}`}
                        </span>
                      </div>
                    </div>

                    <SurfaceBreakdownCard
                      breakdown={currentRoute.surfaceBreakdown}
                      isAnalyzing={isAnalyzingSurface}
                      isSurfaceMode={activeLayerMode === 'surface'}
                      onAnalyze={handleAnalyzeSurface}
                      onToggleMap={() => setActiveLayerMode((mode) => mode === 'surface' ? 'stages' : 'surface')}
                    />

                    <div className="flex gap-2">
                      <Button
                        id="btn-export-gpx"
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs py-1.5 px-2"
                        onClick={handleExportGpx}
                        title={t('planner.btnExportGpx')}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="truncate">{t('planner.btnExportGpx')}</span>
                      </Button>
                      <Button
                        id="btn-append-gpx"
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs py-1.5 px-2"
                        onClick={triggerAppendGpx}
                        title={t('planner.tooltipAppendGpx')}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="truncate">{t('planner.btnAppendGpx')}</span>
                      </Button>
                    </div>

                    {/* Stage Manager Panel Component */}
                    <StageManagerPanel
                      stages={stages}
                      stageMetrics={stageMetrics}
                      activeStageId={activeStageId}
                      onSelectStage={handleSelectStage}
                      onAddStage={handleAddStage}
                      onDeleteStage={handleDeleteStage}
                      onMergeStage={handleMergeStage}
                      onReorderStages={handleReorderStages}
                      onUpdateStageMetadata={handleUpdateStageMetadata}
                      onZoomFullRoute={handleZoomFullRoute}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#576359] leading-relaxed">
                      {t('planner.emptyPrompt')}
                    </p>

                    <div className="flex flex-col gap-2">
                      <Button
                        id="btn-new-route"
                        variant="primary"
                        className="w-full justify-start py-2.5"
                        onClick={() => setIsEditing(true)}
                      >
                        <span>✏️</span>
                        <span>{t('planner.btnDrawNew')}</span>
                      </Button>

                      <Button
                        id="btn-import-gpx"
                        variant="secondary"
                        className="w-full justify-start border-dashed border-[#c5c1b6] bg-[#f8f7f4] hover:bg-[#f0eee7]"
                        onClick={triggerNewGpx}
                      >
                        <span>📂</span>
                        <span>{t('planner.btnImportGpx')}</span>
                      </Button>

                      <Button
                        id="btn-open-route-library-sidebar"
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => setIsLibraryModalOpen(true)}
                      >
                        <span>📚</span>
                        <span>{t('planner.btnMySavedRoutes')}</span>
                      </Button>
                    </div>
                  </>
                )}
              </aside>
            )}

            {/* Companion Mode HUD Panel */}
            {mode === 'companion' && (
              <section
                id="companion-hud"
                className="companion-hud"
                aria-label={t('hud.ariaHud')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-[#24583d] uppercase tracking-wider">
                      {t('hud.modeActive')}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#1b261e] mt-0.5">
                      {currentRoute ? currentRoute.title : t('hud.liveNavigation')}
                    </h3>
                  </div>
                  <span className="text-xl">🧭</span>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" id="hud-stat-distance">
                      {currentRoute ? currentRoute.totalDistanceKm : '0.0'}
                    </div>
                    <div className="stat-label">{t('hud.distance')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="hud-stat-elevation">
                      {currentRoute
                        ? `+${currentRoute.elevationMetrics?.elevationGainMeters ?? 0}m`
                        : '--'}
                    </div>
                    <div className="stat-label">{t('hud.elevation')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="hud-stat-surface">
                      --%
                    </div>
                    <div className="stat-label">{t('hud.unpaved')}</div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </>
      )}

      {/* Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <AdminUsersModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />

      <SaveRouteModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveRoute}
        defaultTitle={currentRoute?.title || t('saveModal.defaultRouteTitle')}
        defaultDescription={currentRoute?.description || ''}
        defaultLocation={currentRoute?.location || ''}
        defaultStatus={currentRoute?.status || 'draft'}
        defaultPriceEur={currentRoute?.priceEur ?? 0}
        distanceKm={currentRoute?.totalDistanceKm || 0}
        pointCount={waypoints.length}
      />

      <RouteLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelectRoute={handleLoadSavedRoute}
        currentRouteId={activeSavedRouteId}
      />

      <RouteMetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        route={currentRoute}
        onSaveSuccess={(updated) => {
          setCurrentRoute((prev) => (prev ? { ...prev, ...updated } : null));
          if (updated.title) {
            feedback.success(t('feedback.routeUpdated', { title: updated.title }));
          }
        }}
      />

      <GpxImportModal
        isOpen={gpxModalConfig.isOpen}
        type={gpxModalConfig.type}
        trackCount={gpxModalConfig.trackCount}
        onChoice={handleGpxModalChoice}
        onClose={() => {
          setGpxModalConfig((prev) => ({ ...prev, isOpen: false }));
          setPendingGpxPayload(null);
        }}
      />
    </div>
  );
};
