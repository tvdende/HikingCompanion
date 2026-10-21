import React, { useState, useEffect } from 'react';
import type { RouteStatus } from '@hiking-companion/core';

export interface SaveRouteData {
  title: string;
  description?: string;
  location?: string;
  status?: RouteStatus;
  priceEur?: number;
}

export interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveRouteData) => Promise<void>;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultLocation?: string;
  defaultStatus?: RouteStatus;
  defaultPriceEur?: number;
  distanceKm: number;
  pointCount: number;
}

export const SaveRouteModal: React.FC<SaveRouteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultTitle = '',
  defaultDescription = '',
  defaultLocation = '',
  defaultStatus = 'draft',
  defaultPriceEur = 0,
  distanceKm,
  pointCount,
}) => {
  const [title, setTitle] = useState(defaultTitle || 'Mijn Wandelroute');
  const [description, setDescription] = useState(defaultDescription);
  const [location, setLocation] = useState(defaultLocation);
  const [status, setStatus] = useState<RouteStatus>(defaultStatus);
  const [priceEur, setPriceEur] = useState(defaultPriceEur.toFixed(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || 'Mijn Wandelroute');
      setDescription(defaultDescription);
      setLocation(defaultLocation);
      setStatus(defaultStatus);
      setPriceEur(defaultPriceEur.toFixed(2));
      setError(null);
    }
  }, [isOpen, defaultTitle, defaultDescription, defaultLocation, defaultStatus, defaultPriceEur]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Geef de route een geldige naam.');
      return;
    }

    const parsedPrice = parseFloat(priceEur);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Voer een geldige prijs in euro in.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        title: trimmedTitle,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        status,
        priceEur: parsedPrice,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save route:', err);
      setError(err.message || 'Kon route niet opslaan in de database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="save-route-modal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
    >
      <div className="modal-content save-route-modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💾</span>
            <h2 id="save-modal-title" className="modal-title">
              Route Opslaan
            </h2>
          </div>
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
            <div id="save-route-error" className="error-message" role="alert" style={{ margin: '0.75rem 1.25rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group">
              <label htmlFor="input-route-title" className="form-label">
                Naam van de route *
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="save-route-status" className="form-label">
                  Status
                </label>
                <select
                  id="save-route-status"
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RouteStatus)}
                >
                  <option value="draft">🟡 Concept (Draft)</option>
                  <option value="definitive">🟢 Definitief (Klaar)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="save-route-price" className="form-label">
                  Prijs (€)
                </label>
                <input
                  id="save-route-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={priceEur}
                  onChange={(e) => setPriceEur(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="save-route-location" className="form-label">
                Regio / Locatie
              </label>
              <input
                id="save-route-location"
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="bijv. Gelderland, Veluwe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="save-route-description" className="form-label">
                Omschrijving (optioneel)
              </label>
              <textarea
                id="save-route-description"
                className="form-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Korte toelichting of etappe-informatie..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="route-save-summary-stats" style={{ marginTop: '0.25rem' }}>
              <div className="summary-stat-item">
                <span className="summary-label">Afstand</span>
                <span className="summary-value">{distanceKm.toFixed(2)} km</span>
              </div>
              <div className="summary-stat-item">
                <span className="summary-label">Routepunten</span>
                <span className="summary-value">{pointCount}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ padding: '1rem 1.25rem', marginTop: '0.5rem' }}>
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
