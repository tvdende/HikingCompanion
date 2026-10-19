import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { HikeRoute } from '@hiking-companion/core';

interface MapCanvasProps {
  route?: HikeRoute | null;
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ route, onLocationFound }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      // Default center: The Netherlands (Utrecht geographical center)
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

  const renderRouteOnMap = useCallback((hikeRoute: HikeRoute) => {
    const map = mapInstance.current;
    if (!map) return;

    // Collect all coordinates in [lng, lat] format for GeoJSON
    const allCoords: [number, number][] = [];
    for (const stage of hikeRoute.stages) {
      for (const pt of stage.coordinates) {
        allCoords.push([pt.lng, pt.lat]);
      }
    }

    if (allCoords.length === 0) return;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {
        title: hikeRoute.title,
      },
      geometry: {
        type: 'LineString',
        coordinates: allCoords,
      },
    };

    // Update or add GeoJSON source and layers
    const source = map.getSource('route-source') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojsonData);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: geojsonData,
      });

      // Background casing line for visual contrast on any terrain
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

    // Place Start Marker (Green)
    const firstCoord = allCoords[0];
    if (startMarkerRef.current) {
      startMarkerRef.current.setLngLat(firstCoord);
    } else {
      startMarkerRef.current = new maplibregl.Marker({ color: '#10b981' })
        .setLngLat(firstCoord)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(`Start: ${hikeRoute.title}`))
        .addTo(map);
    }

    // Place Finish Marker (Red)
    const lastCoord = allCoords[allCoords.length - 1];
    if (endMarkerRef.current) {
      endMarkerRef.current.setLngLat(lastCoord);
    } else {
      endMarkerRef.current = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat(lastCoord)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Finish'))
        .addTo(map);
    }

    // Fit camera viewport bounds with smooth padding
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
  }, []);

  const clearRouteFromMap = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (map.getLayer('route-layer')) map.removeLayer('route-layer');
    if (map.getLayer('route-layer-casing')) map.removeLayer('route-layer-casing');
    if (map.getSource('route-source')) map.removeSource('route-source');

    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }
  }, []);

  // Watch for route prop updates
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const applyRoute = () => {
      if (route && route.stages.length > 0) {
        renderRouteOnMap(route);
      } else {
        clearRouteFromMap();
      }
    };

    if (map.isStyleLoaded()) {
      applyRoute();
    } else {
      map.once('load', applyRoute);
    }
  }, [route, renderRouteOnMap, clearRouteFromMap]);

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
