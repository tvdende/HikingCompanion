import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { HikeRoute, Coordinate, RouteWaypoint } from '@hiking-companion/core';

export interface MapCanvasProps {
  route?: HikeRoute | null;
  waypoints?: RouteWaypoint[];
  isEditing?: boolean;
  onAddWaypoint?: (coord: Coordinate) => void;
  onMoveWaypoint?: (waypointId: string, newCoord: Coordinate) => void;
  onDeleteWaypoint?: (waypointId: string) => void;
  onInsertWaypoint?: (index: number, coord: Coordinate) => void;
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  route,
  waypoints = [],
  isEditing = false,
  onAddWaypoint,
  onMoveWaypoint,
  onDeleteWaypoint,
  onInsertWaypoint,
  onLocationFound,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const staticStartMarkerRef = useRef<maplibregl.Marker | null>(null);
  const staticEndMarkerRef = useRef<maplibregl.Marker | null>(null);
  const waypointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const splitHandlesRef = useRef<maplibregl.Marker[]>([]);
  const isMarkerInteractingRef = useRef(false);

  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep callback refs fresh so event listeners don't need re-binding
  const onAddWaypointRef = useRef(onAddWaypoint);
  const onMoveWaypointRef = useRef(onMoveWaypoint);
  const onDeleteWaypointRef = useRef(onDeleteWaypoint);
  const onInsertWaypointRef = useRef(onInsertWaypoint);
  const isEditingRef = useRef(isEditing);

  useEffect(() => {
    onAddWaypointRef.current = onAddWaypoint;
    onMoveWaypointRef.current = onMoveWaypoint;
    onDeleteWaypointRef.current = onDeleteWaypoint;
    onInsertWaypointRef.current = onInsertWaypoint;
    isEditingRef.current = isEditing;
  }, [onAddWaypoint, onMoveWaypoint, onDeleteWaypoint, onInsertWaypoint, isEditing]);

  // Update cursor on editing mode change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const canvas = map.getCanvas();
    if (canvas) {
      canvas.style.cursor = isEditing ? 'crosshair' : '';
    }
  }, [isEditing]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      // Default center: Utrecht, The Netherlands
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
      setErrorMessage('Map rendering is currently unavailable.');
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Polyline rendering
  const renderRoutePolyline = useCallback((allCoords: [number, number][], title: string) => {
    const map = mapInstance.current;
    if (!map) return;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: { title },
      geometry: {
        type: 'LineString',
        coordinates: allCoords,
      },
    };

    const source = map.getSource('route-source') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojsonData);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: geojsonData,
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
          'line-color': '#0f172a',
          'line-width': 7,
          'line-opacity': 0.85,
        },
      });

      // Primary trail polyline
      map.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0284c7',
          'line-width': 4.5,
        },
      });
    }
  }, []);

  const clearRoutePolyline = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (map.getLayer('route-layer')) map.removeLayer('route-layer');
    if (map.getLayer('route-layer-casing')) map.removeLayer('route-layer-casing');
    if (map.getSource('route-source')) map.removeSource('route-source');
  }, []);

  // Waypoint markers & split handles rendering
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear existing interactive markers
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];
    splitHandlesRef.current.forEach((m) => m.remove());
    splitHandlesRef.current = [];

    // Clear static start/end markers when interactive waypoints exist
    if (waypoints.length > 0) {
      if (staticStartMarkerRef.current) {
        staticStartMarkerRef.current.remove();
        staticStartMarkerRef.current = null;
      }
      if (staticEndMarkerRef.current) {
        staticEndMarkerRef.current.remove();
        staticEndMarkerRef.current = null;
      }
    }

    if (waypoints.length === 0) return;

    // Create interactive markers for each waypoint
    waypoints.forEach((wp, idx) => {
      const isStart = idx === 0;
      const isFinish = idx === waypoints.length - 1 && waypoints.length > 1;

      const markerEl = document.createElement('div');
      markerEl.className = `editor-waypoint-marker ${
        isStart ? 'start-pin' : isFinish ? 'finish-pin' : 'intermediate-pin'
      }`;
      markerEl.id = `waypoint-marker-${idx}`;

      // Marker inner icon/number
      const badge = document.createElement('span');
      badge.className = 'waypoint-badge';
      badge.textContent = isStart ? 'S' : isFinish ? 'F' : `${idx + 1}`;
      markerEl.appendChild(badge);

      // Prevent clicks on marker from placing a new waypoint on map
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        isMarkerInteractingRef.current = true;
      });
      markerEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      const marker = new maplibregl.Marker({
        element: markerEl,
        draggable: isEditing,
      })
        .setLngLat([wp.coordinate.lng, wp.coordinate.lat])
        .addTo(map);

      // Drag events
      marker.on('dragstart', () => {
        isMarkerInteractingRef.current = true;
      });
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onMoveWaypointRef.current?.(wp.id, {
          lat: Number(lngLat.lat.toFixed(6)),
          lng: Number(lngLat.lng.toFixed(6)),
        });
        setTimeout(() => {
          isMarkerInteractingRef.current = false;
        }, 150);
      });

      // Waypoint popup with delete action
      const popupEl = document.createElement('div');
      popupEl.className = 'waypoint-popup-card';

      const titleEl = document.createElement('div');
      titleEl.className = 'waypoint-popup-header';
      titleEl.textContent = `Punt ${idx + 1} ${
        isStart ? '(Start)' : isFinish ? '(Finish)' : ''
      }`;
      popupEl.appendChild(titleEl);

      const coordEl = document.createElement('div');
      coordEl.className = 'waypoint-popup-coords';
      coordEl.textContent = `${wp.coordinate.lat.toFixed(4)}°N, ${wp.coordinate.lng.toFixed(4)}°E`;
      popupEl.appendChild(coordEl);

      const delBtn = document.createElement('button');
      delBtn.className = 'waypoint-popup-delete-btn';
      delBtn.type = 'button';
      delBtn.textContent = '🗑️ Verwijder punt';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        popup.remove();
        onDeleteWaypointRef.current?.(wp.id);
      };
      popupEl.appendChild(delBtn);

      const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setDOMContent(popupEl);
      marker.setPopup(popup);

      waypointMarkersRef.current.push(marker);
    });

    // Render split handles if in editing mode and waypoints >= 2
    if (isEditing && waypoints.length >= 2) {
      for (let i = 0; i < waypoints.length - 1; i++) {
        const fromWp = waypoints[i];
        const toWp = waypoints[i + 1];
        const midLat = (fromWp.coordinate.lat + toWp.coordinate.lat) / 2;
        const midLng = (fromWp.coordinate.lng + toWp.coordinate.lng) / 2;

        const splitEl = document.createElement('div');
        splitEl.className = 'route-split-handle';
        splitEl.title = 'Tussenpunt toevoegen';
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
  }, [waypoints, isEditing]);

  // Route updates
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const applyRoute = () => {
      if (route && route.stages.length > 0) {
        const allCoords: [number, number][] = [];
        for (const stage of route.stages) {
          for (const pt of stage.coordinates) {
            allCoords.push([pt.lng, pt.lat]);
          }
        }

        if (allCoords.length > 0) {
          renderRoutePolyline(allCoords, route.title);

          // Render static markers only if no interactive waypoints exist
          if (waypoints.length === 0) {
            const firstCoord = allCoords[0];
            if (staticStartMarkerRef.current) {
              staticStartMarkerRef.current.setLngLat(firstCoord);
            } else {
              staticStartMarkerRef.current = new maplibregl.Marker({ color: '#10b981' })
                .setLngLat(firstCoord)
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText(`Start: ${route.title}`))
                .addTo(map);
            }

            const lastCoord = allCoords[allCoords.length - 1];
            if (staticEndMarkerRef.current) {
              staticEndMarkerRef.current.setLngLat(lastCoord);
            } else {
              staticEndMarkerRef.current = new maplibregl.Marker({ color: '#ef4444' })
                .setLngLat(lastCoord)
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Finish'))
                .addTo(map);
            }

            // Fit bounds for static imported GPX route
            let minLng = allCoords[0][0];
            let maxLng = allCoords[0][0];
            let minLat = allCoords[0][1];
            let maxLat = allCoords[0][1];
            for (const [lng, lat] of allCoords) {
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
            }
            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              {
                padding: { top: 70, bottom: 70, left: 320, right: 70 },
                maxZoom: 15,
                duration: 1000,
              }
            );
          }
        }
      } else {
        clearRoutePolyline();
        if (staticStartMarkerRef.current) {
          staticStartMarkerRef.current.remove();
          staticStartMarkerRef.current = null;
        }
        if (staticEndMarkerRef.current) {
          staticEndMarkerRef.current.remove();
          staticEndMarkerRef.current = null;
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyRoute();
    } else {
      map.once('load', applyRoute);
    }
  }, [route, waypoints.length, renderRoutePolyline, clearRoutePolyline]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocatie wordt niet ondersteund door deze browser.');
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
            userMarkerRef.current = new maplibregl.Marker({ color: '#0ea5e9' })
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
        title="Toon mijn huidige locatie"
        aria-label="Toon mijn huidige locatie"
        disabled={isLocating}
      >
        {isLocating ? '⏳' : '📍'}
      </button>
    </div>
  );
};
