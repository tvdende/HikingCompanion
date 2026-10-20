import React, { useState } from 'react';
import { showcaseContent } from '../content/showcase';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { hero, features, interactiveDemo, loginGuide } = showcaseContent;
  const [activeTabId, setActiveTabId] = useState(interactiveDemo.tabs[0]?.id || 'gpx-demo');

  const activeTab = interactiveDemo.tabs.find((t) => t.id === activeTabId) || interactiveDemo.tabs[0];

  const handleScrollToDemo = () => {
    const demoEl = document.getElementById('demo-showcase');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-container" id="landing-page">
      {/* 1. Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-badge">{hero.badge}</div>
        <h1 className="landing-hero-title">{hero.headline}</h1>
        <p className="landing-hero-subtitle">{hero.subheadline}</p>

        <div className="landing-hero-actions">
          <button
            id="btn-hero-login"
            type="button"
            className="landing-btn-primary"
            onClick={onOpenLogin}
          >
            <span>🚀</span>
            <span>{hero.ctaLogin}</span>
          </button>
          <button
            id="btn-hero-explore"
            type="button"
            className="landing-btn-secondary"
            onClick={handleScrollToDemo}
          >
            <span>{hero.ctaExplore}</span>
          </button>
        </div>
      </section>

      {/* 2. Feature Cards Grid */}
      <section className="landing-features-section">
        <div className="landing-features-grid">
          {features.map((feat) => (
            <div key={feat.id} className="landing-feature-card" id={`feature-card-${feat.id}`}>
              <div className="landing-feature-header">
                <span className="landing-feature-icon">{feat.icon}</span>
                <span className="landing-feature-badge">{feat.badge}</span>
              </div>
              <h2 className="landing-feature-title">{feat.title}</h2>
              <p className="landing-feature-desc">{feat.description}</p>
              <ul className="landing-feature-bullets">
                {feat.bullets.map((b, idx) => (
                  <li key={idx}>
                    <span className="bullet-check">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Interactive Demo Showcase */}
      <section className="landing-demo-section" id="demo-showcase">
        <div className="landing-section-header">
          <span className="landing-section-tag">Interactieve Demo</span>
          <h2 className="landing-section-title">{interactiveDemo.sectionTitle}</h2>
          <p className="landing-section-subtitle">{interactiveDemo.sectionSubtitle}</p>
        </div>

        {/* Demo Tab Navigation */}
        <div className="landing-demo-tabs" role="tablist">
          {interactiveDemo.tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              role="tab"
              aria-selected={activeTabId === tab.id}
              className={`landing-tab-btn ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.tabLabel}
            </button>
          ))}
        </div>

        {/* Active Demo Card */}
        {activeTab && (
          <div className="landing-demo-display-card" id="active-demo-card">
            <div className="demo-card-header">
              <div>
                <span className="demo-badge">{activeTab.badge}</span>
                <h3 className="demo-title">{activeTab.title}</h3>
                <p className="demo-subtitle">{activeTab.subtitle}</p>
              </div>
            </div>

            {/* Visual Simulation according to previewType */}
            <div className="demo-simulation-box">
              {activeTab.previewType === 'gpx-analysis' && (
                <div className="simulation-gpx">
                  <div className="sim-route-header">
                    <span className="sim-tag">GPX Preview</span>
                    <span className="sim-trail-name">📍 Pieterpad: Etappe 3 (Zuidlaren - Rolde)</span>
                  </div>
                  {/* Simulated Elevation Chart SVG */}
                  <div className="sim-elevation-chart">
                    <svg viewBox="0 0 500 120" className="elevation-svg" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="grad-elev" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 95 Q 50 40 100 70 T 200 30 T 300 85 T 400 45 T 500 75 L 500 120 L 0 120 Z"
                        fill="url(#grad-elev)"
                      />
                      <path
                        d="M 0 95 Q 50 40 100 70 T 200 30 T 300 85 T 400 45 T 500 75"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                      />
                      {/* Waypoint dots */}
                      <circle cx="100" cy="70" r="4" fill="#3b82f6" />
                      <circle cx="200" cy="30" r="5" fill="#f59e0b" />
                      <circle cx="400" cy="45" r="4" fill="#3b82f6" />
                    </svg>
                    <div className="chart-legend">
                      <span>0 km (25m)</span>
                      <span>Hoogste punt: 115m (km 14.2)</span>
                      <span>28.4 km (40m)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab.previewType === 'dual-modes' && (
                <div className="simulation-modes">
                  <div className="modes-comparison-grid">
                    <div className="mode-preview-box planner-box">
                      <div className="mode-box-header">
                        <span className="mode-icon">🗺️</span>
                        <span>Planner Modus</span>
                      </div>
                      <p className="mode-box-desc">
                        Interactieve vector-kaart met alle etappes, waypoints en route-details.
                      </p>
                      <div className="sim-planner-tools">
                        <span className="sim-pill active">Etappes (3)</span>
                        <span className="sim-pill">GPX Export</span>
                        <span className="sim-pill">Kaartlagen</span>
                      </div>
                    </div>
                    <div className="mode-preview-box companion-box">
                      <div className="mode-box-header">
                        <span className="mode-icon">🧭</span>
                        <span>Companion HUD</span>
                      </div>
                      <p className="mode-box-desc">
                        Extra groot contrast, minimale interface, gericht op veilige navigatie.
                      </p>
                      <div className="sim-hud-metrics">
                        <div className="sim-hud-val">
                          <span className="hud-num">4.2</span>
                          <span className="hud-unit">km/u</span>
                        </div>
                        <div className="sim-hud-val">
                          <span className="hud-num">8.6</span>
                          <span className="hud-unit">km over</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab.previewType === 'offline-maps' && (
                <div className="simulation-offline">
                  <div className="offline-status-banner">
                    <span className="status-dot-green"></span>
                    <span>PWA Offline Mode Actief • Alle vectortegels gebufferd</span>
                  </div>
                  <div className="offline-features-list">
                    <div className="offline-item">
                      <span className="offline-icon">💾</span>
                      <div>
                        <strong>Lokale Routebuffer</strong>
                        <p>Geen dataverbinding nodig om je geladen GPX routes te raadplegen.</p>
                      </div>
                    </div>
                    <div className="offline-item">
                      <span className="offline-icon">🛰️</span>
                      <div>
                        <strong>Standalone GPS Tracking</strong>
                        <p>Je interne GPS werkt overal ter wereld, onafhankelijk van 4G/5G.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats badges */}
              {activeTab.stats && (
                <div className="demo-stats-row">
                  {activeTab.stats.map((st, i) => (
                    <div key={i} className="demo-stat-pill">
                      <span className="stat-label">{st.label}</span>
                      <span className="stat-val">
                        {st.value} {st.unit && <small>{st.unit}</small>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explanations */}
            <div className="demo-explanation-box">
              <h4 className="explanation-title">Belangrijkste voordelen:</h4>
              <ul className="explanation-list">
                {activeTab.explanation.map((item, idx) => (
                  <li key={idx}>
                    <span className="explanation-bullet">👉</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* 4. Login Guidance Section */}
      <section className="landing-login-section">
        <div className="landing-login-card">
          <div className="landing-login-header">
            <h2 className="landing-login-title">{loginGuide.title}</h2>
            <p className="landing-login-subtitle">{loginGuide.subtitle}</p>
          </div>

          <div className="landing-steps-grid">
            {loginGuide.steps.map((step) => (
              <div key={step.number} className="landing-step-item">
                <div className="step-circle">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-text">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="landing-cta-center">
            <button
              id="btn-cta-login"
              type="button"
              className="landing-btn-primary large-cta"
              onClick={onOpenLogin}
            >
              <span>🔑</span>
              <span>{loginGuide.ctaButton}</span>
            </button>
            <p className="landing-cta-subtext">
              Directe toegang • Geen creditcard nodig • 100% gratis & open source
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
