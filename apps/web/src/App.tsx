import React, { useState } from 'react';
import type { AppMode } from '@hiking-companion/core';
import { Header } from './components/Header';
import { MapCanvas } from './components/MapCanvas';
import { LoginModal } from './components/LoginModal';
import { AdminUsersModal } from './components/AdminUsersModal';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('planner');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  return (
    <div id="app-root" className="app-container">
      <Header
        currentMode={mode}
        onModeChange={setMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      <main className="main-viewport">
        <MapCanvas />

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

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Klik op de kaart om punten te verbinden, of importeer een bestaande GPX-route om de ondergrond en etappes te analyseren.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                id="btn-import-gpx"
                type="button"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                📂 GPX Route Importeren
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
                  textAlign: 'left'
                }}
              >
                ✏️ Nieuwe Route Tekenen
              </button>
            </div>
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
                  Etappe 1 &bull; Live Navigatie
                </h3>
              </div>
              <span style={{ fontSize: '1.25rem' }}>🧭</span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" id="hud-stat-distance">0.0</div>
                <div className="stat-label">Gelopen (km)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" id="hud-stat-remaining">--</div>
                <div className="stat-label">Resterend (km)</div>
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
