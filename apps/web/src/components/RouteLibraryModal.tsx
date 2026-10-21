import React, { useEffect, useState } from 'react';

export interface SavedRouteListItem {
  id: string;
  title: string;
  totalDistanceKm: number;
  updatedAt: string | Date;
}

export interface RouteLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (routeId: string) => Promise<void>;
  currentRouteId?: string | null;
}

export const RouteLibraryModal: React.FC<RouteLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
  currentRouteId,
}) => {
  const [routes, setRoutes] = useState<SavedRouteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/routes', {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Log eerst in om je opgeslagen routes te bekijken.');
        }
        throw new Error('Kon routes niet laden.');
      }

      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err: any) {
      console.error('Failed to fetch routes:', err);
      setError(err.message || 'Kon routebibliotheek niet ophalen.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoutes();
    }
  }, [isOpen]);

  const handleDelete = async (routeId: string, routeTitle: string) => {
    if (!window.confirm(`Weet je zeker dat je route "${routeTitle}" wilt verwijderen?`)) {
      return;
    }

    try {
      setDeletingId(routeId);
      const res = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Verwijderen mislukt.');
      }

      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    } catch (err: any) {
      console.error('Failed to delete route:', err);
      alert(err.message || 'Fout bij het verwijderen van de route.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = async (routeId: string) => {
    try {
      setLoadingRouteId(routeId);
      await onSelectRoute(routeId);
      onClose();
    } catch (err: any) {
      console.error('Failed to load route:', err);
      alert(err.message || 'Kon route niet inladen.');
    } finally {
      setLoadingRouteId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="route-library-modal" className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="library-modal-title">
      <div className="modal-content route-library-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📚</span>
            <h2 id="library-modal-title" className="modal-title">Mijn Opgeslagen Routes</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Sluit bibliotheek"
          >
            ✕
          </button>
        </div>

        {error && (
          <div id="library-error-banner" className="error-message" role="alert" style={{ margin: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="modal-body route-library-body">
          {isLoading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <span className="spin" style={{ display: 'inline-block', fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</span>
              <p>Routes laden uit database...</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🗺️</span>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Nog geen opgeslagen routes
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                Teken een route op de kaart en klik op <strong>Opslaan</strong> in de werkbalk om deze hier te bewaren.
              </p>
            </div>
          ) : (
            <ul id="saved-routes-list" className="saved-routes-list">
              {routes.map((r) => {
                const isSelected = r.id === currentRouteId;
                const formattedDate = new Date(r.updatedAt).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <li key={r.id} className={`saved-route-item ${isSelected ? 'active-route-item' : ''}`}>
                    <div className="saved-route-info">
                      <div className="saved-route-title-row">
                        <h4 className="saved-route-name">{r.title}</h4>
                        {isSelected && <span className="active-badge">Actief</span>}
                      </div>
                      <div className="saved-route-meta">
                        <span>📏 {r.totalDistanceKm} km</span>
                        <span>📅 {formattedDate}</span>
                      </div>
                    </div>

                    <div className="saved-route-actions">
                      <button
                        id={`btn-load-route-${r.id}`}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSelect(r.id)}
                        disabled={loadingRouteId === r.id}
                        title="Route inladen op de kaart"
                      >
                        {loadingRouteId === r.id ? 'Laden...' : 'Openen'}
                      </button>
                      <button
                        id={`btn-delete-route-${r.id}`}
                        type="button"
                        className="btn btn-danger-subtle btn-sm icon-only"
                        onClick={() => handleDelete(r.id, r.title)}
                        disabled={deletingId === r.id}
                        title="Route verwijderen"
                        aria-label={`Verwijder ${r.title}`}
                      >
                        {deletingId === r.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchRoutes}
            disabled={isLoading}
            title="Vernieuwen"
          >
            🔄 Vernieuwen
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
