import React, { useEffect, useState, useMemo } from 'react';
import type { RouteStatus } from '@hiking-companion/core';
import { RouteMetadataModal } from './RouteMetadataModal';

export interface SavedRouteListItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status: RouteStatus;
  priceEur: number;
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

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'definitive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Metadata Modal State
  const [editingRoute, setEditingRoute] = useState<SavedRouteListItem | null>(null);

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
          throw new Error('Log eerst in om je routebibliotheek te bekijken.');
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
      setSearchQuery('');
      setActiveTab('all');
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

  const handleMetadataSaved = (updated: SavedRouteListItem) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );
  };

  // Filtered routes calculation
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      // Status filter
      if (activeTab === 'draft' && r.status !== 'draft') return false;
      if (activeTab === 'definitive' && r.status !== 'definitive') return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesLocation = (r.location || '').toLowerCase().includes(query);
        const matchesDesc = (r.description || '').toLowerCase().includes(query);
        return matchesTitle || matchesLocation || matchesDesc;
      }

      return true;
    });
  }, [routes, activeTab, searchQuery]);

  const draftCount = routes.filter((r) => r.status === 'draft').length;
  const definitiveCount = routes.filter((r) => r.status === 'definitive').length;

  if (!isOpen) return null;

  return (
    <>
      <div
        id="route-library-modal"
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-modal-title"
      >
        <div className="modal-content route-library-card" style={{ maxWidth: '780px', width: '95%' }}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📚</span>
              <div>
                <h2 id="library-modal-title" className="modal-title">
                  Route Management & Bibliotheek
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Beheer je concepten, definitieve routes en prijsstelling
                </p>
              </div>
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
            <div
              id="library-error-banner"
              className="error-message"
              role="alert"
              style={{ margin: '1rem' }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Search Bar & Filter Tabs */}
          <div style={{ padding: '0.85rem 1.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
                <input
                  id="library-search-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="Zoek op routenaam, regio of omschrijving..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                id="tab-filter-all"
                type="button"
                className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('all')}
              >
                Alle Routes ({routes.length})
              </button>
              <button
                id="tab-filter-draft"
                type="button"
                className={`btn btn-sm ${activeTab === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
                style={
                  activeTab === 'draft'
                    ? { background: 'rgba(234, 179, 8, 0.25)', borderColor: 'rgba(234, 179, 8, 0.6)', color: '#fef08a' }
                    : {}
                }
                onClick={() => setActiveTab('draft')}
              >
                🟡 Concepten ({draftCount})
              </button>
              <button
                id="tab-filter-definitive"
                type="button"
                className={`btn btn-sm ${activeTab === 'definitive' ? 'btn-primary' : 'btn-secondary'}`}
                style={
                  activeTab === 'definitive'
                    ? { background: 'rgba(34, 197, 94, 0.25)', borderColor: 'rgba(34, 197, 94, 0.6)', color: '#bbf7d0' }
                    : {}
                }
                onClick={() => setActiveTab('definitive')}
              >
                🟢 Definitief ({definitiveCount})
              </button>
            </div>
          </div>

          <div className="modal-body route-library-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="loading-state" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <span className="spin" style={{ display: 'inline-block', fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚙️</span>
                <p>Routes laden uit database...</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🗺️</span>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {routes.length === 0 ? 'Nog geen opgeslagen routes' : 'Geen routes gevonden voor dit filter'}
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  {routes.length === 0
                    ? 'Teken of importeer een route en klik op Opslaan om deze in je bibliotheek te bewaren.'
                    : 'Pas je zoekopdracht of statusfilter aan.'}
                </p>
              </div>
            ) : (
              <ul id="saved-routes-list" className="saved-routes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                {filteredRoutes.map((r) => {
                  const isSelected = r.id === currentRouteId;
                  const isDefinitive = r.status === 'definitive';
                  const formattedDate = new Date(r.updatedAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <li
                      key={r.id}
                      className={`saved-route-item ${isSelected ? 'active-route-item' : ''}`}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-surface-elevated)',
                        border: isSelected ? '1px solid rgba(14, 165, 233, 0.5)' : '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 className="saved-route-name" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                              {r.title}
                            </h4>
                            {isSelected && <span className="active-badge" style={{ fontSize: '0.7rem' }}>Actief</span>}
                            <span
                              className="status-badge"
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                fontWeight: 700,
                                background: isDefinitive ? 'rgba(34, 197, 94, 0.18)' : 'rgba(234, 179, 8, 0.18)',
                                color: isDefinitive ? '#4ade80' : '#facc15',
                                border: isDefinitive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                              }}
                            >
                              {isDefinitive ? '🟢 Definitief' : '🟡 Concept'}
                            </span>
                            <span
                              className="price-badge"
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-main)',
                              }}
                            >
                              {r.priceEur && r.priceEur > 0 ? `€${r.priceEur.toFixed(2)}` : 'Gratis'}
                            </span>
                          </div>

                          {r.location && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--primary-400)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span>📍</span>
                              <span>{r.location}</span>
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            id={`btn-load-route-${r.id}`}
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSelect(r.id)}
                            disabled={loadingRouteId === r.id}
                            title="Route inladen op de kaart"
                          >
                            {loadingRouteId === r.id ? 'Laden...' : '🗺️ Openen'}
                          </button>
                          <button
                            id={`btn-edit-metadata-${r.id}`}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingRoute(r)}
                            title="Metadata, omschrijving en prijs bewerken"
                          >
                            ✏️ Beheren
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
                      </div>

                      {r.description && (
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            margin: '2px 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {r.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>📏 {r.totalDistanceKm} km</span>
                        <span>📅 Gewijzigd op {formattedDate}</span>
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

      {editingRoute && (
        <RouteMetadataModal
          isOpen={Boolean(editingRoute)}
          onClose={() => setEditingRoute(null)}
          route={editingRoute}
          onSaveSuccess={handleMetadataSaved}
        />
      )}
    </>
  );
};
