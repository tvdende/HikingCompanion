import React, { useEffect, useState, useMemo } from 'react';
import type { RouteStatus } from '@hiking-companion/core';
import { useTranslation } from '../i18n';
import { RouteMetadataModal } from './RouteMetadataModal';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Map, Edit3, Trash2, Loader2 } from 'lucide-react';

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
  const { t, locale, formatDistance, formatPriceEur } = useTranslation();
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
          throw new Error(t('libraryModal.loginRequired'));
        }
        throw new Error(t('libraryModal.fetchError'));
      }

      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError(err.message || t('libraryModal.fetchError'));
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
    const confirmed = window.confirm(
      t('libraryModal.deleteConfirm', { title: routeTitle })
    );
    if (!confirmed) return;

    try {
      setDeletingId(routeId);
      const res = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(t('libraryModal.deleteError'));
      }

      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    } catch (err: any) {
      alert(err.message || t('libraryModal.deleteError'));
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
      alert(err.message || t('libraryModal.loadError'));
    } finally {
      setLoadingRouteId(null);
    }
  };

  const handleMetadataSaved = (updatedRoute: SavedRouteListItem) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === updatedRoute.id ? { ...r, ...updatedRoute } : r))
    );
    setEditingRoute(null);
  };

  // Filtered Routes calculation
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      // 1. Status Filter
      if (activeTab === 'draft' && r.status !== 'draft') return false;
      if (activeTab === 'definitive' && r.status !== 'definitive') return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesLocation = r.location?.toLowerCase().includes(q);
        const matchesDesc = r.description?.toLowerCase().includes(q);
        return matchesTitle || matchesLocation || matchesDesc;
      }

      return true;
    });
  }, [routes, activeTab, searchQuery]);

  const draftCount = useMemo(() => routes.filter((r) => r.status === 'draft').length, [routes]);
  const definitiveCount = useMemo(() => routes.filter((r) => r.status === 'definitive').length, [routes]);

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
        <div className="modal-content max-w-[780px] w-[95%]">
          <div className="modal-header">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📚</span>
              <div>
                <h2 id="library-modal-title" className="modal-title">
                  {t('libraryModal.title')}
                </h2>
                <p className="text-xs text-[#576359] m-0">
                  {t('libraryModal.subtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label={t('libraryModal.closeAria')}
            >
              ✕
            </button>
          </div>

          {error && (
            <div
              id="library-error-banner"
              className="error-message m-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}

          {/* Search Bar & Filter Tabs */}
          <div className="px-5 py-3 flex flex-col gap-3 border-b border-[#e5e2da]">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">🔍</span>
              <Input
                id="library-search-input"
                type="text"
                className="pl-9"
                placeholder={t('libraryModal.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                id="tab-filter-all"
                variant={activeTab === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                {t('libraryModal.tabAll', { count: routes.length })}
              </Button>
              <Button
                id="tab-filter-draft"
                variant={activeTab === 'draft' ? 'primary' : 'secondary'}
                size="sm"
                className={activeTab === 'draft' ? 'bg-amber-600 border-amber-600' : ''}
                onClick={() => setActiveTab('draft')}
              >
                {t('libraryModal.tabDraft', { count: draftCount })}
              </Button>
              <Button
                id="tab-filter-definitive"
                variant={activeTab === 'definitive' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('definitive')}
              >
                {t('libraryModal.tabDefinitive', { count: definitiveCount })}
              </Button>
            </div>
          </div>

          <div className="modal-body max-h-[420px] overflow-y-auto px-5 py-3">
            {isLoading ? (
              <div className="text-center py-10">
                <span className="inline-block text-2xl mb-2 animate-spin">⚙️</span>
                <p className="text-sm text-[#576359]">{t('libraryModal.loading')}</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="text-center py-12 px-4 text-[#576359]">
                <span className="text-4xl block mb-3">🗺️</span>
                <p className="font-bold text-base text-[#1b261e] mb-1">
                  {routes.length === 0
                    ? t('libraryModal.emptyTitleNoRoutes')
                    : t('libraryModal.emptyTitleNoMatch')}
                </p>
                <p className="text-sm">
                  {routes.length === 0
                    ? t('libraryModal.emptySubtitleNoRoutes')
                    : t('libraryModal.emptySubtitleNoMatch')}
                </p>
              </div>
            ) : (
              <ul id="saved-routes-list" className="flex flex-col gap-3 py-2 list-none">
                {filteredRoutes.map((r) => {
                  const isSelected = r.id === currentRouteId;
                  const isDefinitive = r.status === 'definitive';
                  const formattedDate = new Date(r.updatedAt).toLocaleDateString(
                    locale === 'nl' ? 'nl-NL' : 'en-US',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  );

                  return (
                    <li
                      key={r.id}
                      className={`saved-route-item p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                        isSelected
                          ? 'bg-[#f2f7f4] border-[#24583d] shadow-xs'
                          : 'bg-white border-[#e5e2da] hover:bg-[#faf9f6]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-[#1b261e] m-0">
                              {r.title}
                            </h4>
                            {isSelected && <Badge variant="default">{t('libraryModal.badgeActive')}</Badge>}
                            <Badge variant={isDefinitive ? 'success' : 'secondary'}>
                              {isDefinitive ? '🟢 ' + t('common.definitive') : '🟡 ' + t('common.draft')}
                            </Badge>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f4f3ef] text-[#1b261e] font-semibold border border-[#e5e2da]">
                              {r.priceEur && r.priceEur > 0 ? formatPriceEur(r.priceEur) : t('common.free')}
                            </span>
                          </div>

                          {r.location && (
                            <p className="text-xs text-[#576359] mt-1 flex items-center gap-1">
                              <span>📍</span>
                              <span>{r.location}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            id={`btn-load-route-${r.id}`}
                            variant="primary"
                            size="sm"
                            onClick={() => handleSelect(r.id)}
                            disabled={loadingRouteId === r.id}
                            title={t('libraryModal.tooltipLoad')}
                          >
                            <Map className="w-3.5 h-3.5" />
                            <span>{loadingRouteId === r.id ? t('common.loading') : t('libraryModal.btnOpen')}</span>
                          </Button>
                          <Button
                            id={`btn-edit-metadata-${r.id}`}
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingRoute(r)}
                            title={t('libraryModal.tooltipManage')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t('libraryModal.btnManage')}</span>
                          </Button>
                          <Button
                            id={`btn-delete-route-${r.id}`}
                            variant="danger"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(r.id, r.title)}
                            disabled={deletingId === r.id}
                            title={t('libraryModal.tooltipDelete')}
                            aria-label={t('libraryModal.ariaDelete', { title: r.title })}
                          >
                            {deletingId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {r.description && (
                        <p className="text-xs text-[#576359] line-clamp-2 m-0">
                          {r.description}
                        </p>
                      )}

                      <div className="flex gap-4 text-xs text-[#798a80] mt-0.5">
                        <span>📏 {formatDistance(r.totalDistanceKm)}</span>
                        <span>📅 {t('libraryModal.modifiedOn', { date: formattedDate })}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="modal-actions justify-between px-5 py-4 border-t border-[#e5e2da] mt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchRoutes}
              disabled={isLoading}
              title={t('common.refresh')}
            >
              {t('libraryModal.btnRefresh')}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              {t('libraryModal.btnClose')}
            </Button>
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
