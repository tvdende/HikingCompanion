import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n';
import { suggestFileOrder, type PendingGpxFile } from '../utils/gpxFileOrder';

export type GpxImportChoice = 'append-active' | 'new-stage' | 'separate-stages' | 'merged-single';
export type GpxImportModalType = 'append-choice' | 'multi-track' | 'multi-file' | 'multi-file-append';

export interface GpxImportModalProps {
  isOpen: boolean;
  type: GpxImportModalType;
  trackCount?: number;
  files?: PendingGpxFile[];
  triggerElement?: HTMLElement | null;
  onChoice: (choice: GpxImportChoice, orderedFiles: PendingGpxFile[]) => void;
  onClose: () => void;
}

type FileControl = 'up' | 'down' | 'remove';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
const CHOICE_BUTTON_STYLE: React.CSSProperties = { width: '100%', padding: '12px 16px', fontSize: '0.9rem' };

export const GpxImportModal: React.FC<GpxImportModalProps> = ({
  isOpen,
  type,
  trackCount = 2,
  files = [],
  triggerElement,
  onChoice,
  onClose,
}) => {
  const { t, formatDistance } = useTranslation();
  const [order, setOrder] = useState<PendingGpxFile[]>(files);
  const [announcement, setAnnouncement] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{ id: string; control: FileControl } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const isOrderable = type === 'multi-file' || type === 'multi-file-append';
  const hasErrors = isOrderable && order.some((f) => f.error);

  // Reset the ordered list whenever the dialog opens with a new selection.
  useLayoutEffect(() => {
    if (!isOpen) return;
    setOrder(files);
    setAnnouncement('');
    setDraggedId(null);
    setDragOverId(null);
  }, [isOpen, files]);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = triggerElement || (document.activeElement as HTMLElement | null);
    const dialog = dialogRef.current;
    const initial =
      dialog?.querySelector<HTMLElement>('.gpx-choice-btn:not([disabled])') ||
      dialog?.querySelector<HTMLElement>(`.gpx-file-list ${FOCUSABLE}`) ||
      dialog?.querySelector<HTMLElement>(FOCUSABLE);
    initial?.focus();
    // Only on open: later re-renders must not steal focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen || !triggerRef.current) return;
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (!trigger.isConnected) return;
    trigger.focus();
    const frame = window.requestAnimationFrame(() => trigger.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  // Keep keyboard focus on the moved file, or on a neighbor after removal.
  useEffect(() => {
    if (!pendingFocus || !dialogRef.current) return;
    const item = dialogRef.current.querySelector<HTMLElement>(`[data-file-id="${pendingFocus.id}"]`);
    const fallbacks: FileControl[] = [pendingFocus.control, 'up', 'down', 'remove'];
    const target =
      fallbacks
        .map((control) => item?.querySelector<HTMLButtonElement>(`[data-control="${control}"]:not([disabled])`))
        .find(Boolean) || dialogRef.current.querySelector<HTMLElement>('.gpx-choice-btn:not([disabled])');
    target?.focus();
    setPendingFocus(null);
  }, [pendingFocus, order]);

  if (!isOpen) return null;

  const moveFile = (from: number, to: number, control?: FileControl) => {
    if (from === to || to < 0 || to >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    setAnnouncement(t('gpxModal.movedAnnouncement', { name: moved.name, position: to + 1, total: next.length }));
    if (control) setPendingFocus({ id: moved.id, control });
  };

  const removeFile = (index: number) => {
    if (order.length <= 1) return;
    const removed = order[index];
    const next = order.filter((_, i) => i !== index);
    setOrder(next);
    setAnnouncement(t('gpxModal.removedAnnouncement', { name: removed.name, total: next.length }));
    const neighbor = next[Math.min(index, next.length - 1)];
    setPendingFocus({ id: neighbor.id, control: 'remove' });
  };

  const handleSuggestOrder = () => {
    setOrder(suggestFileOrder(order));
    setAnnouncement(t('gpxModal.orderSuggestedAnnouncement'));
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData('text/plain');
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId) return;
    moveFile(
      order.findIndex((f) => f.id === sourceId),
      order.findIndex((f) => f.id === targetId),
    );
  };

  const choose = (choice: GpxImportChoice) => {
    if (hasErrors) return;
    onChoice(choice, isOrderable ? order : files);
  };

  const title =
    type === 'append-choice'
      ? t('gpxModal.appendChoiceTitle')
      : type === 'multi-file'
      ? t('gpxModal.multiFileTitle')
      : type === 'multi-file-append'
      ? t('gpxModal.multiFileAppendTitle')
      : t('gpxModal.multiTrackTitle');

  const subtitle =
    type === 'append-choice'
      ? t('gpxModal.appendChoiceSubtitle')
      : type === 'multi-file'
      ? t('gpxModal.multiFileSubtitle', { count: order.length })
      : type === 'multi-file-append'
      ? t('gpxModal.multiFileAppendSubtitle', { count: order.length })
      : t('gpxModal.multiTrackSubtitle', { count: trackCount });

  return (
    <div className="modal-backdrop" onClick={onClose} id="gpx-import-modal-overlay">
      <div
        ref={dialogRef}
        className="modal-card gpx-import-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gpx-modal-title"
        aria-describedby="gpx-modal-subtitle"
      >
        <div className="modal-header">
          <h2 id="gpx-modal-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('gpxModal.btnCancel')}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p id="gpx-modal-subtitle" className="modal-subtitle" style={{ marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>

          {isOrderable && (
            <div className="gpx-order-section">
              <div className="gpx-order-header">
                <p id="gpx-order-hint" className="gpx-order-hint">{t('gpxModal.orderHint')}</p>
                {order.length > 1 && (
                  <button
                    type="button"
                    id="btn-suggest-gpx-order"
                    className="secondary-btn gpx-suggest-btn"
                    onClick={handleSuggestOrder}
                  >
                    {t('gpxModal.btnSuggestOrder')}
                  </button>
                )}
              </div>

              <ol
                id="gpx-file-order-list"
                className="gpx-file-list"
                aria-label={t('gpxModal.orderListLabel')}
                aria-describedby="gpx-order-hint"
              >
                {order.map((file, idx) => {
                  const nameId = `gpx-file-name-${file.id}`;
                  return (
                    <li
                      key={file.id}
                      data-file-id={file.id}
                      className={[
                        'gpx-file-item',
                        file.error ? 'has-error' : '',
                        draggedId === file.id ? 'is-dragging' : '',
                        dragOverId === file.id && draggedId !== file.id ? 'is-drag-over' : '',
                      ].filter(Boolean).join(' ')}
                      draggable
                      onDragStart={(e) => {
                        setDraggedId(file.id);
                        e.dataTransfer.setData('text/plain', file.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverId !== file.id) setDragOverId(file.id);
                      }}
                      onDragLeave={() => setDragOverId((prev) => (prev === file.id ? null : prev))}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      onDrop={(e) => handleDrop(e, file.id)}
                    >
                      <span className="gpx-file-drag-handle" title={t('stages.dragToReorder')} aria-hidden="true">
                        ⋮⋮
                      </span>
                      <span
                        className="gpx-file-position"
                        title={t('gpxModal.orderPosition', { position: idx + 1, total: order.length })}
                      >
                        {idx + 1}
                      </span>
                      <div className="gpx-file-info">
                        <span id={nameId} className="gpx-file-name" title={file.name}>
                          {file.name}
                        </span>
                        {file.error ? (
                          <span className="gpx-file-error" role="alert" title={file.error}>
                            {t('gpxModal.fileError')}
                          </span>
                        ) : (
                          <span className="gpx-file-details">
                            {t('gpxModal.fileDetails', {
                              distance: formatDistance(file.distanceKm ?? 0),
                              count: file.trackCount ?? 0,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="gpx-file-actions">
                        <button
                          type="button"
                          className="gpx-file-btn"
                          data-control="up"
                          title={t('stages.moveUp')}
                          aria-label={t('stages.moveUp')}
                          aria-describedby={nameId}
                          disabled={idx === 0}
                          onClick={() => moveFile(idx, idx - 1, 'up')}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="gpx-file-btn"
                          data-control="down"
                          title={t('stages.moveDown')}
                          aria-label={t('stages.moveDown')}
                          aria-describedby={nameId}
                          disabled={idx === order.length - 1}
                          onClick={() => moveFile(idx, idx + 1, 'down')}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="gpx-file-btn gpx-file-remove"
                          data-control="remove"
                          title={t('gpxModal.btnRemoveFile', { name: file.name })}
                          aria-label={t('gpxModal.btnRemoveFile', { name: file.name })}
                          disabled={order.length <= 1}
                          onClick={() => removeFile(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {hasErrors && (
                <p id="gpx-import-blocked" className="gpx-import-blocked" role="status">
                  {t('gpxModal.importBlockedByErrors')}
                </p>
              )}
            </div>
          )}

          <div className="gpx-choice-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {type === 'append-choice' ? (
              <>
                <button
                  type="button"
                  id="btn-choice-new-stage"
                  className="primary-btn gpx-choice-btn"
                  style={CHOICE_BUTTON_STYLE}
                  onClick={() => choose('new-stage')}
                >
                  🆕 {t('gpxModal.btnAppendNewStage')}
                </button>
                <button
                  type="button"
                  id="btn-choice-append-active"
                  className="secondary-btn gpx-choice-btn"
                  style={CHOICE_BUTTON_STYLE}
                  onClick={() => choose('append-active')}
                >
                  ➕ {t('gpxModal.btnAppendToActive')}
                </button>
              </>
            ) : type === 'multi-file-append' ? (
              <button
                type="button"
                id="btn-choice-append-in-order"
                className="primary-btn gpx-choice-btn"
                style={CHOICE_BUTTON_STYLE}
                disabled={hasErrors}
                onClick={() => choose('append-active')}
              >
                ➕ {t('gpxModal.btnAppendInOrder')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="btn-choice-separate-stages"
                  className="primary-btn gpx-choice-btn"
                  style={CHOICE_BUTTON_STYLE}
                  disabled={hasErrors}
                  onClick={() => choose('separate-stages')}
                >
                  {type === 'multi-file'
                    ? `📁 ${t('gpxModal.btnImportFilesAsStages')}`
                    : `🗺️ ${t('gpxModal.btnImportAsStages')}`}
                </button>
                <button
                  type="button"
                  id="btn-choice-merged-single"
                  className="secondary-btn gpx-choice-btn"
                  style={CHOICE_BUTTON_STYLE}
                  disabled={hasErrors}
                  onClick={() => choose('merged-single')}
                >
                  🔗 {t('gpxModal.btnImportAsSingle')}
                </button>
              </>
            )}
          </div>

          <div className="sr-only" aria-live="polite" aria-atomic="true" id="gpx-order-announcer">
            {announcement}
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" id="btn-gpx-import-cancel" className="secondary-btn" onClick={onClose}>
            {t('gpxModal.btnCancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
