import React, { useState, useEffect } from 'react';
import type { RouteStatus } from '@hiking-companion/core';
import { useTranslation } from '../i18n';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
  const { t, formatDistance } = useTranslation();
  const [title, setTitle] = useState(defaultTitle || t('saveModal.defaultRouteTitle'));
  const [description, setDescription] = useState(defaultDescription);
  const [location, setLocation] = useState(defaultLocation);
  const [status, setStatus] = useState<RouteStatus>(defaultStatus);
  const [priceEur, setPriceEur] = useState(defaultPriceEur.toFixed(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || t('saveModal.defaultRouteTitle'));
      setDescription(defaultDescription);
      setLocation(defaultLocation);
      setStatus(defaultStatus);
      setPriceEur(defaultPriceEur.toFixed(2));
      setError(null);
    }
  }, [isOpen, defaultTitle, defaultDescription, defaultLocation, defaultStatus, defaultPriceEur, t]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('saveModal.errTitleRequired'));
      return;
    }

    const parsedPrice = parseFloat(priceEur);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError(t('saveModal.errPriceInvalid'));
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
      setError(err.message || t('saveModal.errSaveFailed'));
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
      <div className="modal-content max-w-[520px]">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">💾</span>
            <h2 id="save-modal-title" className="modal-title">
              {t('saveModal.title')}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('saveModal.closeAria')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div id="save-route-error" className="error-message mx-5 my-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="px-5 flex flex-col gap-3.5">
            <div className="form-group">
              <label htmlFor="input-route-title" className="form-label">
                {t('saveModal.labelTitle')}
              </label>
              <Input
                id="input-route-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('saveModal.placeholderTitle')}
                required
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label htmlFor="save-route-status" className="form-label">
                  {t('saveModal.labelStatus')}
                </label>
                <select
                  id="save-route-status"
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RouteStatus)}
                >
                  <option value="draft">{t('saveModal.statusDraftOption')}</option>
                  <option value="definitive">{t('saveModal.statusDefinitiveOption')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="save-route-price" className="form-label">
                  {t('saveModal.labelPrice')}
                </label>
                <Input
                  id="save-route-price"
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
              <label htmlFor="save-route-location" className="form-label">
                {t('saveModal.labelLocation')}
              </label>
              <Input
                id="save-route-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('saveModal.placeholderLocation')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="save-route-description" className="form-label">
                {t('saveModal.labelDescription')}
              </label>
              <textarea
                id="save-route-description"
                className="form-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('saveModal.placeholderDescription')}
              />
            </div>

            <div className="route-save-summary-stats mt-1">
              <div className="summary-stat-item">
                <span className="summary-label">{t('saveModal.statDistance')}</span>
                <span className="summary-value">{formatDistance(distanceKm)}</span>
              </div>
              <div className="summary-stat-item">
                <span className="summary-label">{t('saveModal.statPoints')}</span>
                <span className="summary-value">{pointCount}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions px-5 py-4 mt-2">
            <Button
              id="btn-cancel-save-route"
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('saveModal.btnCancel')}
            </Button>
            <Button
              id="btn-confirm-save-route"
              type="submit"
              variant="primary"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? t('saveModal.saving') : t('saveModal.btnSave')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
