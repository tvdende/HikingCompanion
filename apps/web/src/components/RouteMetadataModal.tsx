import React, { useState, useEffect } from 'react';
import type { RouteStatus } from '@hiking-companion/core';

export interface RouteMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    status?: RouteStatus;
    priceEur?: number;
  } | null;
  onSaveSuccess: (updatedRoute: any) => void;
}

export const RouteMetadataModal: React.FC<RouteMetadataModalProps> = ({
  isOpen,
  onClose,
  route,
  onSaveSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<RouteStatus>('draft');
  const [priceEur, setPriceEur] = useState('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (route) {
      setTitle(route.title || '');
      setDescription(route.description || '');
      setLocation(route.location || '');
      setStatus(route.status || 'draft');
      setPriceEur(
        typeof route.priceEur === 'number' ? route.priceEur.toFixed(2) : '0.00'
      );
      setError(null);
    }
  }, [route, isOpen]);

  if (!isOpen || !route) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vul een routetitel in.');
      return;
    }

    const parsedPrice = parseFloat(priceEur);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Voer een geldige prijs in euro in (bijv. 0 of 2.99).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/routes/${route.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          status,
          priceEur: parsedPrice,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Opslaan van routegegevens mislukt.');
      }

      const data = await res.json();
      onSaveSuccess(data.route || { ...route, title, description, location, status, priceEur: parsedPrice });
      onClose();
    } catch (err: any) {
      console.error('Failed to update route metadata:', err);
      setError(err.message || 'Fout bij opslaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="route-metadata-modal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-metadata-modal-title"
    >
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <h2 id="route-metadata-modal-title" className="modal-title">
              Route Beheren & Metadata
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            id="metadata-error-banner"
            className="error-message"
            role="alert"
            style={{ margin: '1rem' }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1.25rem' }}>
            <div className="form-group">
              <label htmlFor="metadata-title-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Routetitel *
              </label>
              <input
                id="metadata-title-input"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bijv. Veluwezoom Etappe 1"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="metadata-status-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Status
                </label>
                <select
                  id="metadata-status-select"
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RouteStatus)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="draft">🟡 Concept (Draft)</option>
                  <option value="definitive">🟢 Definitief (Klaar)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="metadata-price-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Prijs (€)
                </label>
                <input
                  id="metadata-price-input"
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
              <label htmlFor="metadata-location-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Regio / Locatie
              </label>
              <input
                id="metadata-location-input"
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bijv. Veluwezoom, Gelderland"
              />
            </div>

            <div className="form-group">
              <label htmlFor="metadata-description-textarea" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Omschrijving & Route-informatie
              </label>
              <textarea
                id="metadata-description-textarea"
                className="form-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf de bezienswaardigheden, ondergrond en bijzonderheden van deze route..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-actions" style={{ justifyContent: 'flex-end', padding: '1rem 1.25rem', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuleren
            </button>
            <button
              id="btn-save-metadata"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Opslaan...' : '💾 Wijzigingen Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
