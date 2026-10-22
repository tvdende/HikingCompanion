import React from 'react';
import { useTranslation } from '../i18n';

export interface GpxImportModalProps {
  isOpen: boolean;
  type: 'append-choice' | 'multi-track' | 'multi-file';
  trackCount?: number;
  onChoice: (choice: 'append-active' | 'new-stage' | 'separate-stages' | 'merged-single') => void;
  onClose: () => void;
}

export const GpxImportModal: React.FC<GpxImportModalProps> = ({
  isOpen,
  type,
  trackCount = 2,
  onChoice,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} id="gpx-import-modal-overlay">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gpx-modal-title"
      >
        <div className="modal-header">
          <h2 id="gpx-modal-title" className="modal-title">
            {type === 'append-choice'
              ? t('gpxModal.appendChoiceTitle')
              : type === 'multi-file'
              ? t('gpxModal.multiFileTitle')
              : t('gpxModal.multiTrackTitle')}
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
          <p className="modal-subtitle" style={{ marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
            {type === 'append-choice'
              ? t('gpxModal.appendChoiceSubtitle')
              : type === 'multi-file'
              ? t('gpxModal.multiFileSubtitle', { count: trackCount })
              : t('gpxModal.multiTrackSubtitle', { count: trackCount })}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {type === 'append-choice' ? (
              <>
                <button
                  type="button"
                  id="btn-choice-new-stage"
                  className="primary-btn"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem' }}
                  onClick={() => onChoice('new-stage')}
                >
                  🆕 {t('gpxModal.btnAppendNewStage')}
                </button>
                <button
                  type="button"
                  id="btn-choice-append-active"
                  className="secondary-btn"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem' }}
                  onClick={() => onChoice('append-active')}
                >
                  ➕ {t('gpxModal.btnAppendToActive')}
                </button>
              </>
            ) : type === 'multi-file' ? (
              <>
                <button
                  type="button"
                  id="btn-choice-separate-stages"
                  className="primary-btn"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem' }}
                  onClick={() => onChoice('separate-stages')}
                >
                  📁 {t('gpxModal.btnImportFilesAsStages')}
                </button>
                <button
                  type="button"
                  id="btn-choice-merged-single"
                  className="secondary-btn"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem' }}
                  onClick={() => onChoice('merged-single')}
                >
                  🔗 {t('gpxModal.btnImportAsSingle')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  id="btn-choice-separate-stages"
                  className="primary-btn"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem' }}
                  onClick={() => onChoice('separate-stages')}
                >
                  🗺️ {t('gpxModal.btnImportAsStages')}
                </button>
                <button
                  type="button"
                  id="btn-choice-merged-single"
                  className="secondary-btn"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem' }}
                  onClick={() => onChoice('merged-single')}
                >
                  🔗 {t('gpxModal.btnImportAsSingle')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="secondary-btn" onClick={onClose}>
            {t('gpxModal.btnCancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
