import React, { useState, useMemo } from 'react';
import { getShowcaseContent } from '../content/showcase';
import { useTranslation } from '../i18n';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogIn, Compass, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { locale, t } = useTranslation();
  const showcase = useMemo(() => getShowcaseContent(locale), [locale]);
  const { hero, features, interactiveDemo, loginGuide, simulations } = showcase;

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
        <Badge variant="default" className="text-sm px-4 py-1.5 font-bold mb-5 shadow-xs">
          {hero.badge}
        </Badge>
        <h1 className="landing-hero-title">{hero.headline}</h1>
        <p className="landing-hero-subtitle">{hero.subheadline}</p>

        <div className="landing-hero-actions">
          <Button
            id="btn-hero-login"
            variant="primary"
            size="lg"
            onClick={onOpenLogin}
          >
            <LogIn className="w-5 h-5" />
            <span>{hero.ctaLogin}</span>
          </Button>
          <Button
            id="btn-hero-explore"
            variant="secondary"
            size="lg"
            onClick={handleScrollToDemo}
          >
            <Compass className="w-5 h-5" />
            <span>{hero.ctaExplore}</span>
          </Button>
        </div>
      </section>

      {/* 2. Feature Cards Grid */}
      <section className="landing-features-section">
        <div className="landing-features-grid">
          {features.map((feat) => (
            <div key={feat.id} className="landing-feature-card" id={`feature-card-${feat.id}`}>
              <div className="landing-feature-header">
                <span className="landing-feature-icon">{feat.icon}</span>
                <Badge variant="default">{feat.badge}</Badge>
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
          <span className="landing-section-tag">{t('landing.demoTag')}</span>
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
                    <span className="sim-tag">{simulations.gpxPreviewTag}</span>
                    <span className="sim-trail-name">{simulations.gpxSampleTrail}</span>
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
                      <span>{simulations.highestPointLabel}</span>
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
                        <span>{simulations.plannerTitle}</span>
                      </div>
                      <p className="mode-box-desc">
                        {simulations.plannerDesc}
                      </p>
                      <div className="sim-planner-tools">
                        <span className="sim-pill active">{simulations.plannerStagesPill}</span>
                        <span className="sim-pill">{simulations.plannerGpxPill}</span>
                        <span className="sim-pill">{simulations.plannerLayersPill}</span>
                      </div>
                    </div>
                    <div className="mode-preview-box companion-box">
                      <div className="mode-box-header">
                        <span className="mode-icon">🧭</span>
                        <span>{simulations.companionTitle}</span>
                      </div>
                      <p className="mode-box-desc">
                        {simulations.companionDesc}
                      </p>
                      <div className="sim-hud-metrics">
                        <div className="sim-hud-val">
                          <span className="hud-num">4.2</span>
                          <span className="hud-unit">{simulations.companionSpeedUnit}</span>
                        </div>
                        <div className="sim-hud-val">
                          <span className="hud-num">8.6</span>
                          <span className="hud-unit">{simulations.companionRemainingUnit}</span>
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
                    <span>{simulations.offlineBanner}</span>
                  </div>
                  <div className="offline-features-list">
                    <div className="offline-item">
                      <span className="offline-icon">💾</span>
                      <div>
                        <strong>{simulations.offlineLocalBufferTitle}</strong>
                        <p>{simulations.offlineLocalBufferDesc}</p>
                      </div>
                    </div>
                    <div className="offline-item">
                      <span className="offline-icon">🛰️</span>
                      <div>
                        <strong>{simulations.offlineGpsTitle}</strong>
                        <p>{simulations.offlineGpsDesc}</p>
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
              <h4 className="explanation-title">{t('landing.benefitsTitle')}</h4>
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
            <Button
              id="btn-cta-login"
              variant="primary"
              size="lg"
              className="shadow-sm"
              onClick={onOpenLogin}
            >
              <Sparkles className="w-5 h-5" />
              <span>{loginGuide.ctaButton}</span>
            </Button>
            <p className="landing-cta-subtext">
              {loginGuide.ctaSubtext}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
