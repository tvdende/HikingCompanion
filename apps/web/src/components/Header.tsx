import React from 'react';
import type { AppMode } from '@hiking-companion/core';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onModeChange }) => {
  return (
    <header id="app-header" className="app-header">
      <div className="brand-section">
        <div className="brand-icon">🥾</div>
        <span id="header-brand" className="brand-title">
          Hiking Companion
        </span>
      </div>

      <div className="mode-toggle-container" role="group" aria-label="Application Mode">
        <button
          id="mode-switch-planner"
          type="button"
          className={`mode-btn ${currentMode === 'planner' ? 'active' : ''}`}
          onClick={() => onModeChange('planner')}
          aria-pressed={currentMode === 'planner'}
        >
          <span>📐</span>
          <span>Planner</span>
        </button>

        <button
          id="mode-switch-companion"
          type="button"
          className={`mode-btn ${currentMode === 'companion' ? 'active' : ''}`}
          onClick={() => onModeChange('companion')}
          aria-pressed={currentMode === 'companion'}
        >
          <span>🧭</span>
          <span>Companion</span>
        </button>
      </div>
    </header>
  );
};
