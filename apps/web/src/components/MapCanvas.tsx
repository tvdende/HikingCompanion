import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

interface MapCanvasProps {
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onLocationFound }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerInstance = useRef<maplibregl.Marker | null>(null);
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
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [5.1214, 52.0907], // [lng, lat]
        zoom: 8
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
            essential: true
          });

          if (!markerInstance.current) {
            markerInstance.current = new maplibregl.Marker({ color: '#0ea5e9' })
              .setLngLat([longitude, latitude])
              .addTo(mapInstance.current);
          } else {
            markerInstance.current.setLngLat([longitude, latitude]);
          }
        }

        if (onLocationFound) {
          onLocationFound({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error.message);
        // Fallback or friendly alert
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
