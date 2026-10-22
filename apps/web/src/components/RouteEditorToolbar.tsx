import React from 'react';
import type { RoutingMode } from '@hiking-companion/core';
import { useTranslation } from '../i18n';
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
  Crosshair,
  Settings,
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
  onOpenMetadata?: () => void;
  onClear: () => void;
  onCenterRoute?: () => void;
  hasRoute?: boolean;
  waypointCount: number;
  isCalculating?: boolean;
  sidebarWidth?: number;
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
  onOpenMetadata,
  onClear,
  onCenterRoute,
  hasRoute = false,
  waypointCount,
  isCalculating = false,
  sidebarWidth,
}) => {
  const { t } = useTranslation();

  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 640;

  return (
    <div
      id="route-editor-toolbar"
      style={{
        left:
          isDesktop && sidebarWidth
            ? `calc(${sidebarWidth + 24}px + (100% - ${sidebarWidth + 24}px) / 2)`
            : undefined,
      }}
      className="absolute top-[calc(var(--header-height)+12px)] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-[#e5e2da] rounded-full flex items-center gap-2 px-3 py-1.5 z-30 shadow-md max-w-[95vw] overflow-x-auto"
      role="toolbar"
      aria-label={t('editorToolbar.ariaToolbar')}
    >
      {/* Edit Mode Toggle */}
      <Button
        id="btn-toggle-edit-mode"
        variant={isEditing ? 'primary' : 'secondary'}
        size="sm"
        onClick={onToggleEditing}
        title={isEditing ? t('editorToolbar.tooltipStopEdit') : t('editorToolbar.tooltipStartEdit')}
        aria-pressed={isEditing}
      >
        {isEditing ? <Edit3 className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
        <span>{isEditing ? t('editorToolbar.btnEditActive') : t('editorToolbar.btnStartEdit')}</span>
      </Button>

      <div className="w-[1px] h-5 bg-[#e5e2da] shrink-0" />

      {/* Snap Mode Toggle */}
      <div
        className="flex bg-[#eeece6] rounded-full p-0.5 border border-[#dfdcd3]"
        role="radiogroup"
        aria-label={t('editorToolbar.routingAria')}
      >
        <button
          id="btn-mode-snap"
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border-none cursor-pointer transition-colors ${
            routingMode === 'snap'
               ? 'bg-[#24583d] text-white shadow-xs selected'
               : 'bg-transparent text-[#576359] hover:text-[#1b261e]'
           }`}
          onClick={() => onToggleRoutingMode('snap')}
          title={t('editorToolbar.tooltipSnap')}
          aria-checked={routingMode === 'snap'}
          role="radio"
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>{t('editorToolbar.methodSnap')}</span>
        </button>
        <button
          id="btn-mode-direct"
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border-none cursor-pointer transition-colors ${
            routingMode === 'direct'
              ? 'bg-[#24583d] text-white shadow-xs selected'
              : 'bg-transparent text-[#576359] hover:text-[#1b261e]'
          }`}
          onClick={() => onToggleRoutingMode('direct')}
          title={t('editorToolbar.tooltipDirect')}
          aria-checked={routingMode === 'direct'}
          role="radio"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>{t('editorToolbar.methodDirect')}</span>
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
          title={t('editorToolbar.tooltipUndo')}
          aria-label={t('editorToolbar.undo')}
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
          title={t('editorToolbar.tooltipRedo')}
          aria-label={t('editorToolbar.redo')}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        {onCenterRoute && (
          <Button
            id="btn-center-route"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sm"
            onClick={onCenterRoute}
            disabled={!hasRoute && waypointCount === 0}
            title={t('editorToolbar.tooltipCenterRoute')}
            aria-label={t('editorToolbar.tooltipCenterRoute')}
          >
            <Crosshair className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="w-[1px] h-5 bg-[#e5e2da] shrink-0" />

      {/* Route Direction Reversal */}
      <Button
        id="btn-reverse-route"
        variant="secondary"
        size="sm"
        onClick={onReverse}
        disabled={waypointCount < 2}
        title={t('editorToolbar.tooltipReverse')}
      >
        <ArrowLeftRight className="w-4 h-4" />
        <span>{t('editorToolbar.reverse')}</span>
      </Button>

      {/* Clear Route */}
      <Button
        id="btn-clear-editor"
        variant="danger"
        size="sm"
        onClick={onClear}
        disabled={waypointCount === 0}
        title={t('editorToolbar.tooltipClear')}
      >
        <Trash2 className="w-4 h-4" />
        <span>{t('editorToolbar.clear')}</span>
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
          title={t('editorToolbar.tooltipSave')}
        >
          <Save className="w-4 h-4" />
          <span>{isCalculating ? t('editorToolbar.calculating') : t('editorToolbar.save')}</span>
        </Button>

        <Button
          id="btn-open-route-library"
          variant="secondary"
          size="sm"
          onClick={onOpenLibrary}
          title={t('editorToolbar.tooltipMyRoutes')}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('editorToolbar.myRoutes')}</span>
        </Button>

        {onOpenMetadata && (
          <Button
            id="btn-edit-metadata-toolbar"
            variant="secondary"
            size="sm"
            onClick={onOpenMetadata}
            disabled={!hasRoute && waypointCount === 0}
            title={t('planner.tooltipManageStatus')}
          >
            <Settings className="w-4 h-4" />
            <span>{t('planner.btnManageStatus')}</span>
          </Button>
        )}
      </div>

      {isCalculating && (
        <span className="flex items-center ml-1 text-sm" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-[#24583d]" />
        </span>
      )}
    </div>
  );
};
