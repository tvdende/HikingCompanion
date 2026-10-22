import React from 'react';
import type { RoutingMode } from '@hiking-companion/core';
import { Button } from './ui/button';
import {
  Edit3,
  MousePointer2,
  Footprints,
  Minus,
  Undo2,
  Redo2,
  ArrowLeftRight,
  Trash2,
  Save,
  BookOpen,
  Loader2,
} from 'lucide-react';

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
    <div
      id="route-editor-toolbar"
      className="absolute top-[calc(var(--header-height)+12px)] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-[#e5e2da] rounded-full flex items-center gap-2 px-3 py-1.5 z-30 shadow-md max-w-[95vw] overflow-x-auto"
      role="toolbar"
      aria-label="Route Editor Tools"
    >
      {/* Edit Mode Toggle */}
      <Button
        id="btn-toggle-edit-mode"
        variant={isEditing ? 'primary' : 'secondary'}
        size="sm"
        onClick={onToggleEditing}
        title={isEditing ? 'Bewerken pauzeren (klik om te stoppen)' : 'Route bewerken starten (klik op kaart om punten te plaatsen)'}
        aria-pressed={isEditing}
      >
        {isEditing ? <Edit3 className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
        <span>{isEditing ? 'Bewerken actief' : 'Route Bewerken'}</span>
      </Button>

      <div className="w-[1px] h-5 bg-[#e5e2da] shrink-0" />

      {/* Snap Mode Toggle */}
      <div className="flex bg-[#eeece6] rounded-full p-0.5 border border-[#dfdcd3]" role="radiogroup" aria-label="Routering methode">
        <button
          id="btn-mode-snap"
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border-none cursor-pointer transition-colors ${
            routingMode === 'snap'
               ? 'bg-[#24583d] text-white shadow-xs'
               : 'bg-transparent text-[#576359] hover:text-[#1b261e]'
           }`}
          onClick={() => onToggleRoutingMode('snap')}
          title="Volg wandelpaden (OpenStreetMap voetpaden)"
          aria-checked={routingMode === 'snap'}
          role="radio"
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Paden</span>
        </button>
        <button
          id="btn-mode-direct"
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border-none cursor-pointer transition-colors ${
            routingMode === 'direct'
              ? 'bg-[#24583d] text-white shadow-xs'
              : 'bg-transparent text-[#576359] hover:text-[#1b261e]'
          }`}
          onClick={() => onToggleRoutingMode('direct')}
          title="Rechte vogelvluchtlijn (vrije lijn)"
          aria-checked={routingMode === 'direct'}
          role="radio"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>Recht</span>
        </button>
      </div>

      <div className="w-[1px] h-5 bg-[#e5e2da] shrink-0" />

      {/* History Controls: Undo & Redo */}
      <div className="flex items-center gap-1">
        <Button
          id="btn-undo"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Ongedaan maken (Ctrl+Z)"
          aria-label="Ongedaan maken"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          id="btn-redo"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Opnieuw uitvoeren (Ctrl+Y)"
          aria-label="Opnieuw uitvoeren"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-[1px] h-5 bg-[#e5e2da] shrink-0" />

      {/* Route Direction Reversal */}
      <Button
        id="btn-reverse-route"
        variant="secondary"
        size="sm"
        onClick={onReverse}
        disabled={waypointCount < 2}
        title="Draai de start- en finishrichting om"
      >
        <ArrowLeftRight className="w-4 h-4" />
        <span>Omdraaien</span>
      </Button>

      {/* Clear Route */}
      <Button
        id="btn-clear-editor"
        variant="danger"
        size="sm"
        onClick={onClear}
        disabled={waypointCount === 0}
        title="Wis alle routepunten"
      >
        <Trash2 className="w-4 h-4" />
        <span>Wissen</span>
      </Button>

      <div className="w-[1px] h-5 bg-[#e5e2da] shrink-0" />

      {/* Storage & Persistence */}
      <div className="flex items-center gap-1.5">
        <Button
          id="btn-save-route"
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={waypointCount < 2 || isCalculating}
          title="Route opslaan in jouw bibliotheek"
        >
          <Save className="w-4 h-4" />
          <span>{isCalculating ? 'Berekenen...' : 'Opslaan'}</span>
        </Button>

        <Button
          id="btn-open-route-library"
          variant="secondary"
          size="sm"
          onClick={onOpenLibrary}
          title="Open opgeslagen routes bibliotheek"
        >
          <BookOpen className="w-4 h-4" />
          <span>Mijn Routes</span>
        </Button>
      </div>

      {isCalculating && (
        <span className="flex items-center ml-1 text-sm" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-[#24583d]" />
        </span>
      )}
    </div>
  );
};
