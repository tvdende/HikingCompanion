import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { HikeRoute, Coordinate, RouteWaypoint, RouteStageDefinition } from '@hiking-companion/core';
import { useTranslation } from '../i18n';

export const STAGE_PALETTE = [
  '#24583d', // Forest Green
  '#c26d2e', // Ochre Terracotta
  '#33658a', // Slate Mountain Blue
  '#6b4c7a', // Purple Sage
  '#1d3557', // Dark Pine
  '#0e7490', // Ocean Cyan
  '#b45309', // Warm Amber
];

export interface MapCanvasProps {
  route?: HikeRoute | null;
  waypoints?: RouteWaypoint[];
  stages?: RouteStageDefinition[];
  activeStageId?: string | null;
  isEditing?: boolean;
  focusRouteTrigger?: number;
  sidebarWidth?: number;
  onAddWaypoint?: (coord: Coordinate) => void;
  onMoveWaypoint?: (waypointId: string, newCoord: Coordinate) => void;
  onDeleteWaypoint?: (waypointId: string) => void;
  onInsertWaypoint?: (index: number, coord: Coordinate) => void;
  onSplitStage?: (waypointId: string) => void;
  onMergeStage?: (stageId: string) => void;
  onSelectStage?: (stageId: string) => void;
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  route,
  waypoints = [],
  stages = [],
  activeStageId,
  isEditing = false,
  focusRouteTrigger,
  sidebarWidth = 390,
  onAddWaypoint,
  onMoveWaypoint,
  onDeleteWaypoint,
  onInsertWaypoint,
  onSplitStage,
  onMergeStage,
  onSelectStage,
  onLocationFound,
}) => {
  const { t } = useTranslation();
  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const boundaryMarkersRef = useRef<maplibregl.Marker[]>([]);
  const waypointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const splitHandlesRef = useRef<maplibregl.Marker[]>([]);
  const isMarkerInteractingRef = useRef(false);
  const prevLoadedRouteIdRef = useRef<string | null>(null);
  const prevTriggerRef = useRef<number | undefined>(focusRouteTrigger);
  const prevActiveStageIdRef = useRef<string | null | undefined>(activeStageId);
  const hasFittedInitialRef = useRef(false);
  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;

  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep callback refs fresh so event listeners don't need re-binding
  const onAddWaypointRef = useRef(onAddWaypoint);
  const onMoveWaypointRef = useRef(onMoveWaypoint);
  const onDeleteWaypointRef = useRef(onDeleteWaypoint);
  const onInsertWaypointRef = useRef(onInsertWaypoint);
  const onSplitStageRef = useRef(onSplitStage);
  const onMergeStageRef = useRef(onMergeStage);
  const onSelectStageRef = useRef(onSelectStage);
  const isEditingRef = useRef(isEditing);

  useEffect(() => {
    onAddWaypointRef.current = onAddWaypoint;
    onMoveWaypointRef.current = onMoveWaypoint;
    onDeleteWaypointRef.current = onDeleteWaypoint;
    onInsertWaypointRef.current = onInsertWaypoint;
    onSplitStageRef.current = onSplitStage;
    onMergeStageRef.current = onMergeStage;
    onSelectStageRef.current = onSelectStage;
    isEditingRef.current = isEditing;
  }, [
    onAddWaypoint,
    onMoveWaypoint,
    onDeleteWaypoint,
    onInsertWaypoint,
    onSplitStage,
    onMergeStage,
    onSelectStage,
    isEditing,
  ]);

  // Update cursor on editing mode change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const canvas = map.getCanvas();
    if (canvas) {
      canvas.style.cursor = isEditing ? 'crosshair' : '';
    }
  }, [isEditing]);

  // Route bounds calculation & auto-centering
  const fitRouteBounds = useCallback((coords: [number, number][]) => {
    const map = mapInstance.current;
    if (!map || coords.length === 0) return;

    let minLng = coords[0][0];
    let maxLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLat = coords[0][1];

    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    if (minLng === maxLng && minLat === maxLat) {
      map.flyTo({
        center: [minLng, minLat],
        zoom: 14,
        essential: true,
      });
      return;
    }

    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
    const currentSidebarWidth = sidebarWidthRef.current || 390;
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: {
          top: 80,
          bottom: 80,
          left: isDesktop ? currentSidebarWidth + 30 : 40,
          right: 50,
        },
        maxZoom: 15,
        duration: 900,
      }
    );
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [5.1214, 52.0907], // [lng, lat]
        zoom: 8,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('click', (e) => {
        if (!isEditingRef.current) return;
        const target = e.originalEvent?.target as HTMLElement | null;
        if (
          target &&
          (target.closest('.editor-waypoint-marker') ||
            target.closest('.route-split-handle') ||
            target.closest('.stage-transition-badge') ||
            target.closest('.maplibregl-popup') ||
            target.closest('.maplibregl-marker'))
        ) {
          return;
        }

        if (isMarkerInteractingRef.current) {
          isMarkerInteractingRef.current = false;
          return;
        }

        if (onAddWaypointRef.current) {
          onAddWaypointRef.current({
            lat: Number(e.lngLat.lat.toFixed(6)),
            lng: Number(e.lngLat.lng.toFixed(6)),
          });
        }
      });

      mapInstance.current = map;
    } catch (err) {
      console.error('Failed to initialize MapLibre GL:', err);
      setErrorMessage(t('map.renderingUnavailable'));
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [t]);

  // Multi-Stage Polyline rendering
  const renderMultiStagePolylines = useCallback(
    (currentRoute: HikeRoute, currentActiveStageId?: string | null) => {
      const map = mapInstance.current;
      if (!map) return;

      const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

      currentRoute.stages.forEach((stage) => {
        const coords: [number, number][] = (stage.coordinates || []).map((pt) => [pt.lng, pt.lat]);
        if (coords.length < 2) return;

        const color = STAGE_PALETTE[(stage.stageNumber - 1) % STAGE_PALETTE.length];
        const isActive = !currentActiveStageId || stage.id === currentActiveStageId;
        const isTransit = stage.transportType && stage.transportType !== 'foot';

        features.push({
          type: 'Feature',
          properties: {
            stageId: stage.id,
            stageNumber: stage.stageNumber,
            title: stage.title,
            color,
            isActive,
            isTransit: Boolean(isTransit),
            transportType: stage.transportType || 'foot',
          },
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        });
      });

      const featureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features,
      };

      const source = map.getSource('route-source') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(featureCollection);
      } else {
        map.addSource('route-source', {
          type: 'geojson',
          data: featureCollection,
        });

        // Background casing line
        map.addLayer({
          id: 'route-layer-casing',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': ['case', ['get', 'isActive'], 8, 5],
            'line-opacity': ['case', ['get', 'isActive'], 0.95, 0.45],
          },
        });

        // Foot / Walking segments (solid line)
        map.addLayer({
          id: 'route-layer-foot',
          type: 'line',
          source: 'route-source',
          filter: ['!=', ['get', 'isTransit'], true],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['case', ['get', 'isActive'], 6, 4],
            'line-opacity': ['case', ['get', 'isActive'], 1.0, 0.55],
          },
        });

        // Public transit segments (dashed line)
        map.addLayer({
          id: 'route-layer-transit',
          type: 'line',
          source: 'route-source',
          filter: ['==', ['get', 'isTransit'], true],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['case', ['get', 'isActive'], 5.5, 3.5],
            'line-opacity': ['case', ['get', 'isActive'], 1.0, 0.6],
            'line-dasharray': [2, 2],
          },
        });

        // Allow clicking polyline to select that stage
        map.on('click', 'route-layer-foot', (e) => {
          if (e.features && e.features[0]?.properties?.stageId) {
            onSelectStageRef.current?.(e.features[0].properties.stageId);
          }
        });
        map.on('click', 'route-layer-transit', (e) => {
          if (e.features && e.features[0]?.properties?.stageId) {
            onSelectStageRef.current?.(e.features[0].properties.stageId);
          }
        });
      }
    },
    []
  );

  const updateDragPreview = useCallback((coordsList: [number, number][][]) => {
    const map = mapInstance.current;
    if (!map) return;

    const features: GeoJSON.Feature<GeoJSON.LineString>[] = coordsList.map((line) => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: line,
      },
    }));

    const data: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features,
    };

    const source = map.getSource('drag-preview-source') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    } else if (map.isStyleLoaded()) {
      map.addSource('drag-preview-source', {
        type: 'geojson',
        data,
      });
      map.addLayer({
        id: 'drag-preview-layer',
        type: 'line',
        source: 'drag-preview-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 3.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.85,
        },
      });
    }
  }, []);

  const clearRoutePolyline = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (map.getLayer('drag-preview-layer')) map.removeLayer('drag-preview-layer');
    if (map.getSource('drag-preview-source')) map.removeSource('drag-preview-source');
    if (map.getLayer('route-layer-transit')) map.removeLayer('route-layer-transit');
    if (map.getLayer('route-layer-foot')) map.removeLayer('route-layer-foot');
    if (map.getLayer('route-layer-casing')) map.removeLayer('route-layer-casing');
    if (map.getSource('route-source')) map.removeSource('route-source');
  }, []);

  // Stage transition badges (S1, F1 / S2, Fn)
  const renderBoundaryBadges = useCallback(
    (currentRoute: HikeRoute) => {
      const map = mapInstance.current;
      if (!map) return;

      boundaryMarkersRef.current.forEach((m) => m.remove());
      boundaryMarkersRef.current = [];

      const stagesCount = currentRoute.stages.length;
      if (stagesCount === 0) return;

      currentRoute.stages.forEach((stage, idx) => {
        const coords = stage.coordinates || [];
        if (coords.length === 0) return;

        const firstPt = coords[0];
        const lastPt = coords[coords.length - 1];
        const isFirstStage = idx === 0;
        const isLastStage = idx === stagesCount - 1;
        const stageColor = STAGE_PALETTE[(stage.stageNumber - 1) % STAGE_PALETTE.length];

        // Start marker of first stage (S1 or S)
        if (isFirstStage) {
          const startEl = document.createElement('div');
          startEl.className = 'stage-transition-badge start-badge';
          startEl.style.backgroundColor = stageColor;
          startEl.textContent = stagesCount > 1 ? `S1` : 'S';

          const marker = new maplibregl.Marker({ element: startEl, anchor: 'center' })
            .setLngLat([firstPt.lng, firstPt.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 15 }).setText(
                `${stage.title} - ${t('map.start')}`
              )
            )
            .addTo(map);
          boundaryMarkersRef.current.push(marker);
        }

        // Transition marker between Stage N and Stage N+1
        if (!isLastStage) {
          const nextStage = currentRoute.stages[idx + 1];
          const nextStageColor =
            STAGE_PALETTE[(nextStage.stageNumber - 1) % STAGE_PALETTE.length];

          const transitionEl = document.createElement('div');
          transitionEl.className = 'stage-transition-badge transition-badge';
          transitionEl.style.background = `linear-gradient(135deg, ${stageColor} 50%, ${nextStageColor} 50%)`;

          const transitIcon =
            nextStage.transportType === 'bus'
              ? '🚌 '
              : nextStage.transportType === 'train'
              ? '🚆 '
              : nextStage.transportType === 'ferry'
              ? '⛴️ '
              : '';

          transitionEl.textContent = `${transitIcon}F${stage.stageNumber} / S${nextStage.stageNumber}`;

          // Popup with merge option
          const popupEl = document.createElement('div');
          popupEl.className = 'stage-transition-popup';

          const headerEl = document.createElement('div');
          headerEl.className = 'stage-transition-popup-header';
          headerEl.textContent = `${stage.title} ➔ ${nextStage.title}`;
          popupEl.appendChild(headerEl);

          const mergeBtn = document.createElement('button');
          mergeBtn.className = 'stage-popup-merge-btn';
          mergeBtn.type = 'button';
          mergeBtn.textContent = t('stages.mergeWithPrevious');
          mergeBtn.onclick = (e) => {
            e.stopPropagation();
            popup.remove();
            onMergeStageRef.current?.(nextStage.id);
          };
          popupEl.appendChild(mergeBtn);

          const popup = new maplibregl.Popup({ offset: 15, closeButton: true }).setDOMContent(
            popupEl
          );

          const marker = new maplibregl.Marker({ element: transitionEl, anchor: 'center' })
            .setLngLat([lastPt.lng, lastPt.lat])
            .setPopup(popup)
            .addTo(map);
          boundaryMarkersRef.current.push(marker);
        }

        // Final finish marker
        if (isLastStage) {
          const finishEl = document.createElement('div');
          finishEl.className = 'stage-transition-badge finish-badge';
          finishEl.style.backgroundColor = stageColor;
          finishEl.textContent = stagesCount > 1 ? `F${stage.stageNumber}` : 'F';

          const marker = new maplibregl.Marker({ element: finishEl, anchor: 'center' })
            .setLngLat([lastPt.lng, lastPt.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 15 }).setText(
                `${stage.title} - ${t('map.finish')}`
              )
            )
            .addTo(map);
          boundaryMarkersRef.current.push(marker);
        }
      });
    },
    [t]
  );

  // Interactive waypoint markers and split handles rendering
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear existing interactive markers
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];
    splitHandlesRef.current.forEach((m) => m.remove());
    splitHandlesRef.current = [];

    if (waypoints.length === 0) return;

    // Filter editable waypoints if activeStageId is set, or allow all
    const activeStage = stages.find((s) => s.id === activeStageId);
    const activeStageNumber = activeStage?.stageNumber || 1;

    waypoints.forEach((wp, idx) => {
      const isStart = idx === 0;
      const isFinish = idx === waypoints.length - 1 && waypoints.length > 1;
      const isIntermediate = !isStart && !isFinish;

      const wpStageId = wp.stageId || (stages[0] ? stages[0].id : 'stage-1');
      const wpStage = stages.find((s) => s.id === wpStageId);
      const isFromActiveStage = !activeStageId || wpStageId === activeStageId;
      const stageColor = wpStage
        ? STAGE_PALETTE[(wpStage.stageNumber - 1) % STAGE_PALETTE.length]
        : STAGE_PALETTE[0];

      const markerEl = document.createElement('div');
      markerEl.className = `editor-waypoint-marker ${
        isStart ? 'start-pin' : isFinish ? 'finish-pin' : 'intermediate-pin'
      } ${!isFromActiveStage ? 'is-inactive-stage' : ''}`;
      markerEl.id = `waypoint-marker-${idx}`;
      markerEl.style.borderColor = stageColor;

      const badge = document.createElement('span');
      badge.className = 'waypoint-badge';
      badge.textContent = isStart ? 'S' : isFinish ? 'F' : `${idx + 1}`;
      markerEl.appendChild(badge);

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        isMarkerInteractingRef.current = true;
      });

      const marker = new maplibregl.Marker({
        element: markerEl,
        draggable: isEditing && isFromActiveStage,
      })
        .setLngLat([wp.coordinate.lng, wp.coordinate.lat])
        .addTo(map);

      // Drag events
      marker.on('dragstart', () => {
        isMarkerInteractingRef.current = true;
      });
      marker.on('drag', () => {
        isMarkerInteractingRef.current = true;
        const currentLngLat = marker.getLngLat();
        const cur: [number, number] = [currentLngLat.lng, currentLngLat.lat];
        const lines: [number, number][][] = [];

        const currentWps = waypointsRef.current;
        const prevWp = idx > 0 ? currentWps[idx - 1] : null;
        const nextWp = idx < currentWps.length - 1 ? currentWps[idx + 1] : null;

        if (prevWp) {
          lines.push([[prevWp.coordinate.lng, prevWp.coordinate.lat], cur]);
        }
        if (nextWp) {
          lines.push([cur, [nextWp.coordinate.lng, nextWp.coordinate.lat]]);
        }

        updateDragPreview(lines);
      });
      marker.on('dragend', () => {
        updateDragPreview([]);
        const lngLat = marker.getLngLat();
        onMoveWaypointRef.current?.(wp.id, {
          lat: Number(lngLat.lat.toFixed(6)),
          lng: Number(lngLat.lng.toFixed(6)),
        });
        setTimeout(() => {
          isMarkerInteractingRef.current = false;
        }, 150);
      });

      // Waypoint popup with split & delete actions
      const popupEl = document.createElement('div');
      popupEl.className = 'waypoint-popup-card';

      const titleEl = document.createElement('div');
      titleEl.className = 'waypoint-popup-header';
      const stageName = wpStage?.title || t('planner.stageDefaultTitle', { number: activeStageNumber });
      titleEl.textContent = `${t('map.point', { number: idx + 1 })} (${stageName})`;
      popupEl.appendChild(titleEl);

      const coordEl = document.createElement('div');
      coordEl.className = 'waypoint-popup-coords';
      coordEl.textContent = `${wp.coordinate.lat.toFixed(4)}°N, ${wp.coordinate.lng.toFixed(4)}°E`;
      popupEl.appendChild(coordEl);

      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'waypoint-popup-actions';

      // Intermediate waypoint: add "Split stage" button
      if (isIntermediate && isEditing) {
        const splitBtn = document.createElement('button');
        splitBtn.className = 'waypoint-popup-split-btn';
        splitBtn.type = 'button';
        splitBtn.textContent = t('stages.splitAtPoint');
        splitBtn.onclick = (e) => {
          e.stopPropagation();
          popup.remove();
          onSplitStageRef.current?.(wp.id);
        };
        buttonsContainer.appendChild(splitBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.className = 'waypoint-popup-delete-btn';
      delBtn.type = 'button';
      delBtn.textContent = t('map.deletePoint');
      delBtn.onclick = (e) => {
        e.stopPropagation();
        popup.remove();
        onDeleteWaypointRef.current?.(wp.id);
      };
      buttonsContainer.appendChild(delBtn);

      popupEl.appendChild(buttonsContainer);

      const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setDOMContent(popupEl);
      marker.setPopup(popup);

      waypointMarkersRef.current.push(marker);
    });

    // Render split handles between adjacent waypoints
    if (isEditing && waypoints.length >= 2) {
      for (let i = 0; i < waypoints.length - 1; i++) {
        const fromWp = waypoints[i];
        const toWp = waypoints[i + 1];

        // Only draw handle if at least one belongs to active stage
        if (
          activeStageId &&
          fromWp.stageId !== activeStageId &&
          toWp.stageId !== activeStageId
        ) {
          continue;
        }

        const midLat = (fromWp.coordinate.lat + toWp.coordinate.lat) / 2;
        const midLng = (fromWp.coordinate.lng + toWp.coordinate.lng) / 2;

        const splitEl = document.createElement('div');
        splitEl.className = 'route-split-handle';
        splitEl.title = t('map.addIntermediatePoint');
        splitEl.textContent = '+';

        splitEl.addEventListener('click', (e) => {
          e.stopPropagation();
          isMarkerInteractingRef.current = true;
          onInsertWaypointRef.current?.(i + 1, {
            lat: Number(midLat.toFixed(6)),
            lng: Number(midLng.toFixed(6)),
          });
          setTimeout(() => {
            isMarkerInteractingRef.current = false;
          }, 150);
        });

        const splitMarker = new maplibregl.Marker({
          element: splitEl,
          draggable: false,
        })
          .setLngLat([midLng, midLat])
          .addTo(map);

        splitHandlesRef.current.push(splitMarker);
      }
    }
  }, [waypoints, stages, activeStageId, isEditing, t]);

  // Route updates & camera focus
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const applyRoute = () => {
      if (route && route.stages && route.stages.length > 0) {
        const allCoords: [number, number][] = [];
        for (const stage of route.stages) {
          for (const pt of stage.coordinates || []) {
            allCoords.push([pt.lng, pt.lat]);
          }
        }

        if (allCoords.length > 0) {
          renderMultiStagePolylines(route, activeStageId);
          renderBoundaryBadges(route);

          const isNewRouteLoaded = Boolean(
            route.id &&
              route.id !== 'active-route' &&
              route.id !== prevLoadedRouteIdRef.current
          );
          const isExplicitFocus = Boolean(
            focusRouteTrigger !== undefined &&
              focusRouteTrigger > 0 &&
              focusRouteTrigger !== prevTriggerRef.current
          );
          const isInitialStaticLoad =
            waypoints.length === 0 && !hasFittedInitialRef.current;
          const isStageFocus =
            activeStageId !== undefined &&
            activeStageId !== null &&
            activeStageId !== prevActiveStageIdRef.current;

          if (isStageFocus) {
            // Find coordinates of the active stage to zoom specifically to it
            const activeStage = route.stages.find((s) => s.id === activeStageId);
            const activeCoords: [number, number][] = (activeStage?.coordinates || []).map((pt) => [
              pt.lng,
              pt.lat,
            ]);
            if (activeCoords.length > 0) {
              fitRouteBounds(activeCoords);
            } else {
              fitRouteBounds(allCoords);
            }
          } else if (isNewRouteLoaded || isExplicitFocus || isInitialStaticLoad) {
            fitRouteBounds(allCoords);
            hasFittedInitialRef.current = true;
          }

          if (route.id && route.id !== 'active-route') {
            prevLoadedRouteIdRef.current = route.id;
          }
          prevTriggerRef.current = focusRouteTrigger;
          prevActiveStageIdRef.current = activeStageId;
        }
      } else {
        clearRoutePolyline();
        boundaryMarkersRef.current.forEach((m) => m.remove());
        boundaryMarkersRef.current = [];
        prevLoadedRouteIdRef.current = null;
      }
    };

    if (map.isStyleLoaded()) {
      applyRoute();
    } else {
      map.once('load', applyRoute);
    }
  }, [
    route,
    activeStageId,
    waypoints.length,
    focusRouteTrigger,
    renderMultiStagePolylines,
    renderBoundaryBadges,
    clearRoutePolyline,
    fitRouteBounds,
  ]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(t('map.geoNotSupported'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;

        if (mapInstance.current) {
          mapInstance.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true,
          });

          if (!userMarkerRef.current) {
            userMarkerRef.current = new maplibregl.Marker({ color: '#24583d' })
              .setLngLat([longitude, latitude])
              .addTo(mapInstance.current);
          } else {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          }
        }

        if (onLocationFound) {
          onLocationFound({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div id="map-container" className="map-canvas-container">
      {errorMessage ? (
        <div className="map-fallback-notice" style={{ padding: '2rem', textAlign: 'center' }}>
          {errorMessage}
        </div>
      ) : (
        <div ref={mapContainer} id="maplibre-canvas" className="maplibre-canvas" />
      )}

      <button
        id="btn-locate-user"
        type="button"
        className="map-locate-btn"
        onClick={handleLocateMe}
        title={t('map.locateMeTooltip')}
        aria-label={t('map.locateMeTooltip')}
        disabled={isLocating}
      >
        {isLocating ? '⏳' : '📍'}
      </button>
    </div>
  );
};
