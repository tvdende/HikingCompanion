import React, { useState } from 'react';

export interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
  defaultTitle?: string;
  distanceKm: number;
  pointCount: number;
}

export const SaveRouteModal: React.FC<SaveRouteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultTitle = '',
  distanceKm,
  pointCount,
}) => {
  const [title, setTitle] = useState(defaultTitle || 'Mijn Wandelroute');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Geef de route een geldige naam.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(trimmedTitle);
      onClose();
    } catch (err: any) {
      console.error('Failed to save route:', err);
      setError(err.message || 'Kon route niet opslaan in de database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="save-route-modal" className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
      <div className="modal-content save-route-modal-card">
        <div className="modal-header">
          <h2 id="save-modal-title" className="modal-title">💾 Route Opslaan</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Sluit dialoog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div id="save-route-error" className="error-message" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="input-route-title" className="form-label">
              Naam van de route
            </label>
            <input
              id="input-route-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Veluwezoom Rondwandeling"
              required
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="route-save-summary-stats">
            <div className="summary-stat-item">
              <span className="summary-label">Afstand</span>
              <span className="summary-value">{distanceKm.toFixed(2)} km</span>
            </div>
            <div className="summary-stat-item">
              <span className="summary-label">Routepunten</span>
              <span className="summary-value">{pointCount}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              id="btn-cancel-save-route"
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuleren
            </button>
            <button
              id="btn-confirm-save-route"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Opslaan...' : 'Route Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
