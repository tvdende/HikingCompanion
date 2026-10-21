import React, { useState, useEffect } from 'react';
import type { RouteStatus } from '@hiking-companion/core';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          status,
          priceEur: parsedPrice,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Kon routemetadata niet bijwerken.');
      }

      const updated = await res.json();
      onSaveSuccess(updated.route || { ...route, title, description, location, status, priceEur: parsedPrice });
      onClose();
    } catch (err: any) {
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
      aria-labelledby="metadata-modal-title"
    >
      <div className="modal-content max-w-[560px]">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 id="metadata-modal-title" className="modal-title">
              Route Beheren & Status
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

        {error && (
          <div
            id="metadata-error-banner"
            className="error-message mx-5 my-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            role="alert"
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="px-5 flex flex-col gap-3.5">
            <div className="form-group">
              <label htmlFor="metadata-title-input" className="form-label">
                Routetitel *
              </label>
              <Input
                id="metadata-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bijv. Veluwezoom Etappe 1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label htmlFor="metadata-status-select" className="form-label">
                  Status
                </label>
                <select
                  id="metadata-status-select"
                  className="form-input cursor-pointer"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RouteStatus)}
                >
                  <option value="draft">🟡 Concept (Draft)</option>
                  <option value="definitive">🟢 Definitief (Klaar)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="metadata-price-input" className="form-label">
                  Prijs (€)
                </label>
                <Input
                  id="metadata-price-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEur}
                  onChange={(e) => setPriceEur(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="metadata-location-input" className="form-label">
                Regio / Locatie
              </label>
              <Input
                id="metadata-location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bijv. Veluwezoom, Gelderland"
              />
            </div>

            <div className="form-group">
              <label htmlFor="metadata-description-textarea" className="form-label">
                Omschrijving & Route-informatie
              </label>
              <textarea
                id="metadata-description-textarea"
                className="form-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf de bezienswaardigheden, ondergrond en bijzonderheden van deze route..."
              />
            </div>
          </div>

          <div className="modal-actions px-5 py-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuleren
            </Button>
            <Button
              id="btn-save-metadata"
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Opslaan...' : '💾 Wijzigingen Opslaan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
