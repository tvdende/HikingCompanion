import React from 'react';
import type { RoutingMode } from '@hiking-companion/core';

export interface RouteEditorToolbarProps {
  isEditing: boolean;
  onToggleEditing: () => void;
  routingMode: RoutingMode;
  onToggleRoutingMode: (mode: RoutingMode) => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  onReverse: () => void;
  onSave: () => void;
  onOpenLibrary: () => void;
  onClear: () => void;
  waypointCount: number;
  isCalculating?: boolean;
}

export const RouteEditorToolbar: React.FC<RouteEditorToolbarProps> = ({
  isEditing,
  onToggleEditing,
  routingMode,
  onToggleRoutingMode,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onReverse,
  onSave,
  onOpenLibrary,
  onClear,
  waypointCount,
  isCalculating = false,
}) => {
  return (
    <div id="route-editor-toolbar" className="route-editor-toolbar" role="toolbar" aria-label="Route Editor Tools">
      {/* Edit Mode Toggle */}
      <button
        id="btn-toggle-edit-mode"
        type="button"
        className={`editor-tool-btn ${isEditing ? 'active' : ''}`}
        onClick={onToggleEditing}
        title={isEditing ? 'Bewerken pauzeren (klik om te stoppen)' : 'Route bewerken starten (klik op kaart om punten te plaatsen)'}
        aria-pressed={isEditing}
      >
        <span className="tool-icon">{isEditing ? '✏️' : '🖱️'}</span>
        <span className="tool-text">{isEditing ? 'Bewerken actief' : 'Route Bewerken'}</span>
      </button>

      <div className="toolbar-divider" />

      {/* Snap Mode Toggle */}
      <div className="routing-mode-selector" role="radiogroup" aria-label="Routering methode">
        <button
          id="btn-mode-snap"
          type="button"
          className={`mode-toggle-btn ${routingMode === 'snap' ? 'selected' : ''}`}
          onClick={() => onToggleRoutingMode('snap')}
          title="Volg wandelpaden (OpenStreetMap voetpaden)"
          aria-checked={routingMode === 'snap'}
          role="radio"
        >
          <span className="tool-icon">🥾</span>
          <span className="mode-label">Paden</span>
        </button>
        <button
          id="btn-mode-direct"
          type="button"
          className={`mode-toggle-btn ${routingMode === 'direct' ? 'selected' : ''}`}
          onClick={() => onToggleRoutingMode('direct')}
          title="Rechte vogelvluchtlijn (vrije lijn)"
          aria-checked={routingMode === 'direct'}
          role="radio"
        >
          <span className="tool-icon">📏</span>
          <span className="mode-label">Recht</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* History Controls: Undo & Redo */}
      <div className="history-group">
        <button
          id="btn-undo"
          type="button"
          className="editor-tool-btn icon-only"
          onClick={onUndo}
          disabled={!canUndo}
          title="Ongedaan maken (Ctrl+Z)"
          aria-label="Ongedaan maken"
        >
          ↩️
        </button>
        <button
          id="btn-redo"
          type="button"
          className="editor-tool-btn icon-only"
          onClick={onRedo}
          disabled={!canRedo}
          title="Opnieuw uitvoeren (Ctrl+Y)"
          aria-label="Opnieuw uitvoeren"
        >
          ↪️
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Route Direction Reversal */}
      <button
        id="btn-reverse-route"
        type="button"
        className="editor-tool-btn"
        onClick={onReverse}
        disabled={waypointCount < 2}
        title="Draai de start- en finishrichting om"
      >
        <span className="tool-icon">🔄</span>
        <span className="tool-text">Omdraaien</span>
      </button>

      {/* Clear Route */}
      <button
        id="btn-clear-editor"
        type="button"
        className="editor-tool-btn danger"
        onClick={onClear}
        disabled={waypointCount === 0}
        title="Wis alle routepunten"
      >
        <span className="tool-icon">🗑️</span>
        <span className="tool-text">Wissen</span>
      </button>

      <div className="toolbar-divider" />

      {/* Storage & Persistence */}
      <div className="persistence-group">
        <button
          id="btn-save-route"
          type="button"
          className="editor-tool-btn primary"
          onClick={onSave}
          disabled={waypointCount < 2 || isCalculating}
          title="Route opslaan in jouw bibliotheek"
        >
          <span className="tool-icon">💾</span>
          <span className="tool-text">{isCalculating ? 'Berekenen...' : 'Opslaan'}</span>
        </button>

        <button
          id="btn-open-route-library"
          type="button"
          className="editor-tool-btn secondary"
          onClick={onOpenLibrary}
          title="Open opgeslagen routes bibliotheek"
        >
          <span className="tool-icon">📚</span>
          <span className="tool-text">Mijn Routes</span>
        </button>
      </div>

      {isCalculating && (
        <span className="calculating-indicator" aria-live="polite">
          <span className="spin">⚙️</span>
        </span>
      )}
    </div>
  );
};
