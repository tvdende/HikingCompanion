import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AppMode, HikeRoute, Coordinate, RouteWaypoint, RouteSegment, RoutingMode } from '@hiking-companion/core';
import {
  parseGpx,
  serializeToGpx,
  interpolateStraightLine,
  insertWaypoint,
  deleteWaypoint,
  moveWaypoint,
  reverseWaypoints,
  flattenRouteCoordinates,
  calculateHaversineDistanceKm,
} from '@hiking-companion/core';
import { Header } from './components/Header';
import { MapCanvas } from './components/MapCanvas';
import { LoginModal } from './components/LoginModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { LandingPage } from './components/LandingPage';
import { RouteEditorToolbar } from './components/RouteEditorToolbar';
import { SaveRouteModal } from './components/SaveRouteModal';
import { RouteLibraryModal } from './components/RouteLibraryModal';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<AppMode>('planner');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

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
                  segmentCoords = data.coordinates.map(([lng, lat]: [number, number]) => ({
                    lng,
                    lat,
                  }));
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
  const handleSaveRoute = async (title: string) => {
    if (!currentRoute) return;

    const payload = {
      title,
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
    setCurrentRoute((prev) => (prev ? { ...prev, id: data.route.id, title } : null));
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
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date(r.updatedAt).toISOString(),
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

  // GPX File handling
  const handleGpxFile = async (file: File) => {
    setFileError(null);
    try {
      const text = await file.text();
      const defaultTitle = file.name.replace(/\.gpx$/i, '');
      const parsedRoute = parseGpx(text, defaultTitle);
      setCurrentRoute(parsedRoute);
      setActiveSavedRouteId(null);
      setWaypoints([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setIsEditing(false);
    } catch (err: any) {
      console.error('GPX parse error:', err);
      setFileError(err.message || 'Kon het GPX bestand niet verwerken.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleGpxFile(file);
    }
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
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.gpx') || file.type.includes('xml'))) {
      handleGpxFile(file);
    } else {
      setFileError('Alleen .gpx bestanden worden ondersteund.');
    }
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
                  <h3>Laat je GPX bestand hier los</h3>
                  <p>De route wordt direct op de kaart getoond</p>
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
                        <span className="route-badge">Actieve Route</span>
                        <h3 id="route-title" className="route-card-title">
                          {currentRoute.title}
                        </h3>
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
                        <span className="stat-label">Dalen</span>
                        <span id="stat-elevation-loss" className="stat-num text-loss">
                          -{currentRoute.elevationMetrics?.elevationLossMeters ?? 0} m
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
                        id="btn-change-gpx"
                        type="button"
                        className="secondary-gpx-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>📂</span>
                        <span>GPX Bestand</span>
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
                      Klik op de kaart om punten te verbinden, of importeer een bestaande GPX-route
                      om te navigeren en analyseren.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        id="btn-new-route"
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(14, 165, 233, 0.5)',
                          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                        }}
                      >
                        <span>✏️</span>
                        <span>Nieuwe Route Tekenen</span>
                      </button>

                      <button
                        id="btn-import-gpx"
                        type="button"
                        className="import-gpx-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>📂</span>
                        <span>GPX Route Importeren</span>
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
        distanceKm={currentRoute?.totalDistanceKm || 0}
        pointCount={waypoints.length}
      />

      <RouteLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelectRoute={handleLoadSavedRoute}
        currentRouteId={activeSavedRouteId}
      />
    </div>
  );
};
