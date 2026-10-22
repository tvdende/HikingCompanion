import React, { useState } from 'react';
import type { RouteStageDefinition, TransportType } from '@hiking-companion/core';
import type { RouteStagesBreakdown } from '@hiking-companion/core';
import { STAGE_PALETTE } from './MapCanvas.js';
import { useTranslation } from '../i18n';

export interface StageManagerPanelProps {
  stages: RouteStageDefinition[];
  stageMetrics: RouteStagesBreakdown;
  activeStageId?: string | null;
  onSelectStage: (stageId: string) => void;
  onAddStage: () => void;
  onDeleteStage: (stageId: string) => void;
  onMergeStage: (stageId: string) => void;
  onReorderStages: (newOrder: string[]) => void;
  onUpdateStageMetadata: (stageId: string, updates: Partial<RouteStageDefinition>) => void;
  onZoomFullRoute: () => void;
}

export const StageManagerPanel: React.FC<StageManagerPanelProps> = ({
  stages,
  stageMetrics,
  activeStageId,
  onSelectStage,
  onAddStage,
  onDeleteStage,
  onMergeStage,
  onReorderStages,
  onUpdateStageMetadata,
  onZoomFullRoute,
}) => {
  const { t } = useTranslation();
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [expandedNotesStageId, setExpandedNotesStageId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedStageId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedStageId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const currentIds = stages.map((s) => s.id);
    const sourceIdx = currentIds.indexOf(sourceId);
    const targetIdx = currentIds.indexOf(targetId);

    if (sourceIdx < 0 || targetIdx < 0) return;

    const newOrder = [...currentIds];
    const [removed] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, removed);

    onReorderStages(newOrder);
    setDraggedStageId(null);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const newOrder = stages.map((s) => s.id);
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    onReorderStages(newOrder);
  };

  const handleDelete = (stage: RouteStageDefinition) => {
    const confirmMessage = t('stages.deleteStageConfirm', { title: stage.title });
    if (window.confirm(confirmMessage)) {
      onDeleteStage(stage.id);
    }
  };

  // Find metric for stage
  const getMetricForStage = (id: string) => {
    return stageMetrics.stages.find((m) => m.stageId === id);
  };

  return (
    <div className="stages-panel" id="stages-manager-panel">
      {/* Panel Header */}
      <div className="stages-panel-header">
        <div className="stages-panel-title">
          <span>{t('stages.title')}</span>
          <span className="stages-count-badge">
            {stages.length === 1
              ? t('stages.singleStageCount')
              : t('stages.totalStagesCount', { count: stages.length })}
          </span>
        </div>

        <div className="stages-panel-actions">
          <button
            type="button"
            className="btn-reset-view"
            id="btn-view-full-route"
            onClick={onZoomFullRoute}
            title={t('stages.viewFullRoute')}
          >
            <span>🔍</span>
            <span>{t('stages.viewFullRoute')}</span>
          </button>
          <button
            type="button"
            className="btn-add-stage"
            id="btn-add-new-stage"
            onClick={onAddStage}
            title={t('stages.newStage')}
          >
            <span>➕</span>
            <span>{t('stages.newStage')}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Distance Breakdown: Hiking vs Public Transit */}
      <div className="stages-summary-bar">
        <span>
          <strong>{stageMetrics.totalDistanceKm} {t('common.km')}</strong> {t('common.total').toLowerCase()}
        </span>
        {stageMetrics.transitDistanceKm > 0 && (
          <span className="stages-summary-transit">
            ({stageMetrics.hikingDistanceKm} {t('common.km')} {t('stages.hikingDistance').toLowerCase()} •{' '}
            {stageMetrics.transitDistanceKm} {t('common.km')} {t('stages.transitDistance').toLowerCase()})
          </span>
        )}
      </div>

      {/* Ordered Stage Cards List */}
      <div className="stage-cards-list">
        {stages.map((stage, idx) => {
          const isActive = activeStageId === stage.id;
          const metric = getMetricForStage(stage.id);
          const stageColor = STAGE_PALETTE[(stage.stageNumber - 1) % STAGE_PALETTE.length];
          const hasNotes = Boolean(stage.notes && stage.notes.trim().length > 0);
          const isNotesOpen = expandedNotesStageId === stage.id || hasNotes;

          return (
            <div
              key={stage.id}
              className={`stage-card ${isActive ? 'is-active' : ''}`}
              id={`stage-card-${stage.stageNumber}`}
              draggable
              onDragStart={(e) => handleDragStart(e, stage.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              onClick={() => onSelectStage(stage.id)}
            >
              {/* Row 1: Drag handle, Stage Badge, Inline Title, Reorder Controls */}
              <div className="stage-card-header">
                <span
                  className="stage-drag-handle"
                  title={t('stages.dragToReorder')}
                  aria-label={t('stages.dragToReorder')}
                  onClick={(e) => e.stopPropagation()}
                >
                  ⋮⋮
                </span>

                <span
                  className="stage-badge-tag"
                  style={{ backgroundColor: stageColor }}
                  title={`Etappe ${stage.stageNumber}`}
                >
                  E{stage.stageNumber}
                </span>

                <input
                  type="text"
                  className="stage-title-input"
                  value={stage.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    onUpdateStageMetadata(stage.id, { title: e.target.value })
                  }
                  title={stage.title}
                />

                <div className="stage-reorder-controls" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="stage-step-btn"
                    title={t('stages.moveUp')}
                    aria-label={t('stages.moveUp')}
                    disabled={idx === 0}
                    onClick={() => handleMoveStep(idx, 'up')}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="stage-step-btn"
                    title={t('stages.moveDown')}
                    aria-label={t('stages.moveDown')}
                    disabled={idx === stages.length - 1}
                    onClick={() => handleMoveStep(idx, 'down')}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Row 2: Metrics, Transport Select, and Stage Action Buttons */}
              <div className="stage-card-row">
                <div className="stage-card-metrics">
                  <span className="metric-item">
                    <strong>{metric?.distanceKm ?? 0}</strong> km
                  </span>
                  {(metric?.elevationGainMeters ?? 0) > 0 && (
                    <span className="metric-item">
                      <strong>+{metric?.elevationGainMeters}</strong>m
                    </span>
                  )}
                  <span className="metric-item">
                    <strong>{metric?.waypointCount ?? 0}</strong> pt
                  </span>
                </div>

                <div className="stage-card-controls" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="transport-select"
                    value={stage.transportType || 'foot'}
                    aria-label={t('stages.transportTypeLabel')}
                    onChange={(e) =>
                      onUpdateStageMetadata(stage.id, {
                        transportType: e.target.value as TransportType,
                      })
                    }
                  >
                    <option value="foot">🥾 {t('stages.transportFoot')}</option>
                    <option value="bus">🚌 {t('stages.transportBus')}</option>
                    <option value="train">🚆 {t('stages.transportTrain')}</option>
                    <option value="ferry">⛴️ {t('stages.transportFerry')}</option>
                  </select>

                  <div className="stage-card-actions">
                    {idx > 0 && (
                      <button
                        type="button"
                        className="stage-action-btn merge"
                        onClick={() => onMergeStage(stage.id)}
                        title={t('stages.mergeWithPrevious')}
                      >
                        🔗
                      </button>
                    )}

                    {stages.length > 1 && (
                      <button
                        type="button"
                        className="stage-action-btn delete"
                        onClick={() => handleDelete(stage)}
                        title={t('stages.deleteStage')}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3 (Optional / Expandable): Notes Input */}
              <div className="stage-card-notes-container" onClick={(e) => e.stopPropagation()}>
                {isNotesOpen ? (
                  <input
                    type="text"
                    className="stage-notes-input"
                    placeholder={t('stages.notesPlaceholder')}
                    value={stage.notes || ''}
                    onChange={(e) =>
                      onUpdateStageMetadata(stage.id, { notes: e.target.value })
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className="stage-notes-toggle-btn"
                    onClick={() => setExpandedNotesStageId(stage.id)}
                  >
                    + 💬 {t('stages.notesPlaceholder')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
