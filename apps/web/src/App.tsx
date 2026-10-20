import React, { useState, useRef } from 'react';
import type { AppMode, HikeRoute } from '@hiking-companion/core';
import { parseGpx, serializeToGpx } from '@hiking-companion/core';
import { Header } from './components/Header';
import { MapCanvas } from './components/MapCanvas';
import { LoginModal } from './components/LoginModal';
import { AdminUsersModal } from './components/AdminUsersModal';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('planner');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<HikeRoute | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGpxFile = async (file: File) => {
    setFileError(null);
    try {
      const text = await file.text();
      const defaultTitle = file.name.replace(/\.gpx$/i, '');
      const parsedRoute = parseGpx(text, defaultTitle);
      setCurrentRoute(parsedRoute);
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
    // Reset file input
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

      <input
        id="gpx-file-input"
        ref={fileInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,text/xml"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      <main className="main-viewport">
        <MapCanvas route={currentRoute} />

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Route Planner
              </h2>
              <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px' }}>
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
                    onClick={() => setCurrentRoute(null)}
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
                      {currentRoute.stages.reduce((acc: number, s) => acc + s.coordinates.length, 0)} pts
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
                    <span>Ander bestand</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Klik op de kaart om punten te verbinden, of importeer een bestaande GPX-route om de ondergrond en etappes te analyseren.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    id="btn-new-route"
                    type="button"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(14, 165, 233, 0.4)',
                      background: 'var(--primary-600)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    ✏️ Nieuwe Route Tekenen
                  </button>
                </div>
              </>
            )}
          </aside>
        )}

        {/* Companion Mode HUD Panel */}
        {mode === 'companion' && (
          <section id="companion-hud" className="companion-hud" aria-label="Hike Companion HUD">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Wandelmodus Actief
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>
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
                  {currentRoute ? `+${currentRoute.elevationMetrics?.elevationGainMeters ?? 0}m` : '--'}
                </div>
                <div className="stat-label">Hoogtemeters</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" id="hud-stat-surface">--%</div>
                <div className="stat-label">Onverhard</div>
              </div>
            </div>
          </section>
        )}
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <AdminUsersModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};
