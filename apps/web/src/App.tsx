import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  AppMode,
  HikeRoute,
  Coordinate,
  RouteWaypoint,
  RouteSegment,
  RoutingMode,
  RouteStatus,
} from '@hiking-companion/core';
import {
  parseGpx,
  stitchGpxRoutes,
  serializeToGpx,
  interpolateStraightLine,
  insertWaypoint,
  deleteWaypoint,
  moveWaypoint,
  reverseWaypoints,
  flattenRouteCoordinates,
  calculateHaversineDistanceKm,
  extractWaypointsFromRoute,
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
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<AppMode>('planner');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

  // Route & Editor State
  const [currentRoute, setCurrentRoute] = useState<HikeRoute | null>(null);
  const [activeSavedRouteId, setActiveSavedRouteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [routingMode, setRoutingMode] = useState<RoutingMode>('snap');
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [, setSegments] = useState<RouteSegment[]>([]);
  const [history, setHistory] = useState<RouteWaypoint[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // File Upload State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to commit waypoints change to history stack
  const applyWaypointsUpdate = useCallback(
    (newWaypoints: RouteWaypoint[]) => {
      setWaypoints(newWaypoints);
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newWaypoints);
      if (nextHistory.length > 50) nextHistory.shift();
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Recalculate route polyline & segments whenever waypoints or routing mode change
  useEffect(() => {
    let isCancelled = false;

    const updateRoute = async () => {
      if (waypoints.length === 0) {
        setSegments([]);
        return;
      }

      if (waypoints.length === 1) {
        setSegments([]);
        const singlePt = waypoints[0].coordinate;
        setCurrentRoute({
          id: activeSavedRouteId || 'active-route',
          title: currentRoute?.title || 'Nieuwe Route',
          description: currentRoute?.description,
          location: currentRoute?.location,
          status: currentRoute?.status || 'draft',
          priceEur: currentRoute?.priceEur ?? 0,
          totalDistanceKm: 0,
          stages: [
            {
              id: 'stage-1',
              stageNumber: 1,
              title: 'Etappe 1',
              distanceKm: 0,
              coordinates: [singlePt],
            },
          ],
          elevationMetrics: { elevationGainMeters: 0, elevationLossMeters: 0 },
          createdAt: currentRoute?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      setIsCalculating(true);
      try {
        const newSegments: RouteSegment[] = [];
        let totalMeters = 0;

        for (let i = 0; i < waypoints.length - 1; i++) {
          const fromWp = waypoints[i];
          const toWp = waypoints[i + 1];
          const mode = toWp.routingMode || routingMode;

          let segmentCoords: Coordinate[] = [];
          let segmentDistMeters = 0;

          if (mode === 'direct') {
            segmentCoords = interpolateStraightLine(fromWp.coordinate, toWp.coordinate);
            segmentDistMeters =
              calculateHaversineDistanceKm(fromWp.coordinate, toWp.coordinate) * 1000;
          } else {
            try {
              const res = await fetch('/api/routing/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  coordinates: [
                    [fromWp.coordinate.lng, fromWp.coordinate.lat],
                    [toWp.coordinate.lng, toWp.coordinate.lat],
                  ],
                }),
              });

              if (res.ok) {
                const data = await res.json();
                if (data.coordinates && data.coordinates.length > 0) {
                  segmentCoords = data.coordinates.map((item: any) => {
                    if (Array.isArray(item)) {
                      return { lng: item[0], lat: item[1] };
                    }
                    return { lng: item.lng, lat: item.lat, elevation: item.elevation };
                  });
                  segmentDistMeters =
                    data.distanceMeters ||
                    calculateHaversineDistanceKm(fromWp.coordinate, toWp.coordinate) * 1000;
                } else {
                  segmentCoords = interpolateStraightLine(fromWp.coordinate, toWp.coordinate);
                  segmentDistMeters =
                    calculateHaversineDistanceKm(fromWp.coordinate, toWp.coordinate) * 1000;
                }
              } else {
                segmentCoords = interpolateStraightLine(fromWp.coordinate, toWp.coordinate);
                segmentDistMeters =
                  calculateHaversineDistanceKm(fromWp.coordinate, toWp.coordinate) * 1000;
              }
            } catch {
              segmentCoords = interpolateStraightLine(fromWp.coordinate, toWp.coordinate);
              segmentDistMeters =
                calculateHaversineDistanceKm(fromWp.coordinate, toWp.coordinate) * 1000;
            }
          }

          newSegments.push({
            id: `seg-${fromWp.id}-${toWp.id}`,
            fromWaypointId: fromWp.id,
            toWaypointId: toWp.id,
            routingMode: mode,
            coordinates: segmentCoords,
            distanceMeters: segmentDistMeters,
          });

          totalMeters += segmentDistMeters;
        }

        if (isCancelled) return;

        setSegments(newSegments);
        const flattened = flattenRouteCoordinates(waypoints, newSegments);
        const distKm = Number((totalMeters / 1000).toFixed(2));

        setCurrentRoute({
          id: activeSavedRouteId || 'active-route',
          title: currentRoute?.title || 'Nieuwe Route',
          description: currentRoute?.description,
          location: currentRoute?.location,
          status: currentRoute?.status || 'draft',
          priceEur: currentRoute?.priceEur ?? 0,
          totalDistanceKm: distKm,
          stages: [
            {
              id: 'stage-1',
              stageNumber: 1,
              title: 'Etappe 1',
              distanceKm: distKm,
              coordinates: flattened,
            },
          ],
          elevationMetrics: {
            elevationGainMeters: 0,
            elevationLossMeters: 0,
          },
          createdAt: currentRoute?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error calculating route segments:', err);
      } finally {
        if (!isCancelled) {
          setIsCalculating(false);
        }
      }
    };

    updateRoute();

    return () => {
      isCancelled = true;
    };
  }, [waypoints, routingMode, activeSavedRouteId]);

  // Editor Actions
  const handleAddWaypoint = (coord: Coordinate) => {
    const newWp: RouteWaypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      coordinate: coord,
      routingMode,
    };
    applyWaypointsUpdate([...waypoints, newWp]);
  };

  const handleMoveWaypoint = (wpId: string, newCoord: Coordinate) => {
    const updated = moveWaypoint(waypoints, wpId, newCoord);
    applyWaypointsUpdate(updated);
  };

  const handleDeleteWaypoint = (wpId: string) => {
    const updated = deleteWaypoint(waypoints, wpId);
    applyWaypointsUpdate(updated);
  };

  const handleInsertWaypoint = (index: number, coord: Coordinate) => {
    const newWp: RouteWaypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      coordinate: coord,
      routingMode,
    };
    const updated = insertWaypoint(waypoints, newWp, index);
    applyWaypointsUpdate(updated);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setWaypoints(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setWaypoints(history[newIdx]);
    }
  };

  const handleReverse = () => {
    if (waypoints.length < 2) return;
    const reversed = reverseWaypoints(waypoints);
    applyWaypointsUpdate(reversed);
  };

  const handleClear = () => {
    applyWaypointsUpdate([]);
    setCurrentRoute(null);
    setActiveSavedRouteId(null);
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
      coordinates: currentRoute.stages[0]?.coordinates || [],
      waypoints,
      stages: currentRoute.stages,
      elevationMetrics: currentRoute.elevationMetrics,
    };

    const isUpdate = Boolean(activeSavedRouteId);
    const url = isUpdate ? `/api/routes/${activeSavedRouteId}` : '/api/routes';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Fout bij opslaan van de route.');
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
          }
        : null
    );
  };

  const handleLoadSavedRoute = async (routeId: string) => {
    const res = await fetch(`/api/routes/${routeId}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Kon route niet ophalen.');
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
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };

    setCurrentRoute(loadedRoute);
    setActiveSavedRouteId(r.id);

    if (r.waypoints && r.waypoints.length > 0) {
      setWaypoints(r.waypoints);
      setHistory([r.waypoints]);
      setHistoryIndex(0);
    } else {
      const coords = r.coordinates || [];
      if (coords.length > 0) {
        const generatedWps: RouteWaypoint[] = [
          { id: 'wp-start', coordinate: coords[0], routingMode: 'snap' },
          ...(coords.length > 1
            ? [
                {
                  id: 'wp-end',
                  coordinate: coords[coords.length - 1],
                  routingMode: 'snap' as const,
                },
              ]
            : []),
        ];
        setWaypoints(generatedWps);
        setHistory([generatedWps]);
        setHistoryIndex(0);
      }
    }

    setIsEditing(true);
  };

  // Multi-GPX File handling and Track Stitching
  const handleGpxFiles = async (files: File[], append = false) => {
    if (!files || files.length === 0) return;
    setFileError(null);

    try {
      const parsedRoutes: HikeRoute[] = [];
      for (const file of files) {
        const text = await file.text();
        const defaultTitle = file.name.replace(/\.gpx$/i, '');
        parsedRoutes.push(parseGpx(text, defaultTitle));
      }

      let finalRoute: HikeRoute;
      if (append && currentRoute) {
        finalRoute = stitchGpxRoutes([currentRoute, ...parsedRoutes]);
      } else if (parsedRoutes.length === 1) {
        finalRoute = parsedRoutes[0];
      } else {
        finalRoute = stitchGpxRoutes(parsedRoutes);
      }

      setCurrentRoute(finalRoute);
      setActiveSavedRouteId(null);

      // Extract draggable waypoints from the stitched track
      const { waypoints: extractedWps, segments: extractedSegments } =
        extractWaypointsFromRoute(finalRoute);
      setWaypoints(extractedWps);
      setSegments(extractedSegments);
      setHistory([extractedWps]);
      setHistoryIndex(0);
      setIsEditing(true);
    } catch (err: any) {
      console.error('GPX parse/stitching error:', err);
      setFileError(err.message || 'Kon de GPX bestanden niet verwerken of aan elkaar koppelen.');
    }
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
      setFileError('Alleen .gpx bestanden worden ondersteund.');
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
    } catch (err) {
      console.error('Failed to export GPX:', err);
      alert('Er is een fout opgetreden bij het exporteren van de route.');
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

          <main className="main-viewport">
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
                onClear={handleClear}
                waypointCount={waypoints.length}
                isCalculating={isCalculating}
              />
            )}

            <MapCanvas
              route={currentRoute}
              waypoints={waypoints}
              isEditing={isEditing}
              onAddWaypoint={handleAddWaypoint}
              onMoveWaypoint={handleMoveWaypoint}
              onDeleteWaypoint={handleDeleteWaypoint}
              onInsertWaypoint={handleInsertWaypoint}
            />

            {isDraggingFile && (
              <div id="drop-zone-overlay" className="drag-drop-overlay">
                <div className="drop-zone-card">
                  <span className="drop-icon">📂</span>
                  <h3>Laat je GPX bestand(en) hier los</h3>
                  <p>Meerdere bestanden worden automatisch aan elkaar gekoppeld tot één route</p>
                </div>
              </div>
            )}

            {/* Planner Mode Overlay Panel */}
            {mode === 'planner' && (
              <aside id="planner-panel" className="planner-sidebar" aria-label="Route Planner">
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Route Planner
                  </h2>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(14, 165, 233, 0.2)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '99px',
                    }}
                  >
                    Desktop Modus
                  </span>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '4px' }}>
                          <span className="route-badge">Actieve Route</span>
                          <span
                            id="active-route-status-badge"
                            style={{
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: '99px',
                              fontWeight: 700,
                              background:
                                currentRoute.status === 'definitive'
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : 'rgba(234, 179, 8, 0.2)',
                              color:
                                currentRoute.status === 'definitive' ? '#4ade80' : '#facc15',
                            }}
                          >
                            {currentRoute.status === 'definitive' ? '🟢 Definitief' : '🟡 Concept'}
                          </span>
                          {currentRoute.priceEur !== undefined && currentRoute.priceEur > 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '1px 6px',
                                borderRadius: '99px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-main)',
                              }}
                            >
                              €{currentRoute.priceEur.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <h3 id="route-title" className="route-card-title">
                          {currentRoute.title}
                        </h3>
                        {currentRoute.location && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary-400)', margin: '2px 0 0' }}>
                            📍 {currentRoute.location}
                          </p>
                        )}
                      </div>
                      <button
                        id="btn-clear-route"
                        type="button"
                        className="clear-route-btn"
                        onClick={handleClear}
                        title="Route sluiten"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="trail-stats-grid">
                      <div className="trail-stat-box">
                        <span className="stat-label">Afstand</span>
                        <span id="stat-total-distance" className="stat-num">
                          {currentRoute.totalDistanceKm} km
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">Stijgen</span>
                        <span id="stat-elevation-gain" className="stat-num text-gain">
                          +{currentRoute.elevationMetrics?.elevationGainMeters ?? 0} m
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">Etappes</span>
                        <span id="stat-stage-count" className="stat-num">
                          {currentRoute.stages.length}
                        </span>
                      </div>
                      <div className="trail-stat-box">
                        <span className="stat-label">Punten</span>
                        <span id="stat-point-count" className="stat-num">
                          {waypoints.length > 0
                            ? `${waypoints.length} wps`
                            : `${currentRoute.stages.reduce(
                                (acc: number, s) => acc + s.coordinates.length,
                                0
                              )} pts`}
                        </span>
                      </div>
                    </div>

                    <div className="route-actions-row">
                      <button
                        id="btn-export-gpx"
                        type="button"
                        className="export-gpx-btn"
                        onClick={handleExportGpx}
                      >
                        <span>💾</span>
                        <span>Download GPX</span>
                      </button>
                      <button
                        id="btn-append-gpx"
                        type="button"
                        className="secondary-gpx-btn"
                        onClick={triggerAppendGpx}
                        title="Extra GPX aan deze route toevoegen en koppelen"
                      >
                        <span>➕</span>
                        <span>GPX Toevoegen</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        id="btn-edit-active-route"
                        type="button"
                        className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                        onClick={() => {
                          if (!isEditing && waypoints.length === 0 && currentRoute) {
                            const { waypoints: extractedWps, segments: extractedSegments } =
                              extractWaypointsFromRoute(currentRoute);
                            setWaypoints(extractedWps);
                            setSegments(extractedSegments);
                            setHistory([extractedWps]);
                            setHistoryIndex(0);
                          }
                          setIsEditing((prev) => !prev);
                        }}
                      >
                        <span>{isEditing ? '✓' : '✏️'}</span>
                        <span>
                          {isEditing ? 'Afronden' : 'Punten slepen'}
                        </span>
                      </button>
                      <button
                        id="btn-edit-metadata-active"
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setIsMetadataModalOpen(true)}
                        title="Beheer titel, status, omschrijving en prijs"
                      >
                        ⚙️ Beheer & Status
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        id="btn-save-route-sidebar"
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setIsSaveModalOpen(true)}
                        disabled={isCalculating}
                      >
                        💾 Opslaan
                      </button>
                      <button
                        id="btn-open-route-library-sidebar"
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setIsLibraryModalOpen(true)}
                      >
                        📚 Bibliotheek
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      Klik op de kaart om punten te verbinden, of importeer één of meerdere GPX-bestanden
                      om te navigeren, koppelen en analyseren.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        id="btn-new-route"
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary"
                        style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          width: '100%',
                        }}
                      >
                        <span>✏️</span>
                        <span>Nieuwe Route Tekenen</span>
                      </button>

                      <button
                        id="btn-import-gpx"
                        type="button"
                        className="import-gpx-btn"
                        onClick={triggerNewGpx}
                      >
                        <span>📂</span>
                        <span>GPX Route(s) Importeren</span>
                      </button>

                      <button
                        id="btn-open-route-library-sidebar"
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsLibraryModalOpen(true)}
                        style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        <span>📚</span>
                        <span>Mijn Opgeslagen Routes</span>
                      </button>
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
                aria-label="Hike Companion HUD"
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#38bdf8',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Wandelmodus Actief
                    </span>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'white',
                        marginTop: '2px',
                      }}
                    >
                      {currentRoute ? currentRoute.title : 'Live Navigatie'}
                    </h3>
                  </div>
                  <span style={{ fontSize: '1.25rem' }}>🧭</span>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" id="hud-stat-distance">
                      {currentRoute ? currentRoute.totalDistanceKm : '0.0'}
                    </div>
                    <div className="stat-label">Afstand (km)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="hud-stat-elevation">
                      {currentRoute
                        ? `+${currentRoute.elevationMetrics?.elevationGainMeters ?? 0}m`
                        : '--'}
                    </div>
                    <div className="stat-label">Hoogtemeters</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="hud-stat-surface">
                      --%
                    </div>
                    <div className="stat-label">Onverhard</div>
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
        defaultTitle={currentRoute?.title || 'Mijn Wandelroute'}
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
        }}
      />
    </div>
  );
};
