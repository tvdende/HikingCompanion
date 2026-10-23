import React, { useEffect, useState, useMemo } from 'react';
import type { RouteStatus, HikeRoute } from '@hiking-companion/core';
import { serializeToGpx } from '@hiking-companion/core';
import { useTranslation } from '../i18n';
import { RouteMetadataModal } from './RouteMetadataModal';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Map, Edit3, Trash2, Loader2, Download, Search, RefreshCw, Layers } from 'lucide-react';
import { useFeedback } from '../context/FeedbackContext';

export interface SavedRouteListItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status: RouteStatus;
  priceEur: number;
  totalDistanceKm: number;
  stageCount?: number;
  elevationMetrics?: { elevationGainMeters: number; elevationLossMeters: number } | null;
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
  const feedback = useFeedback();
  const [routes, setRoutes] = useState<SavedRouteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'definitive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Metadata Modal State
  const [editingRoute, setEditingRoute] = useState<SavedRouteListItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    route: SavedRouteListItem;
    trigger: HTMLElement;
  } | null>(null);

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

  const handleDelete = (route: SavedRouteListItem, trigger: HTMLElement) => {
    setPendingDelete({ route, trigger });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { route } = pendingDelete;
    const { id: routeId, title: routeTitle } = route;
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
      feedback.success(t('feedback.routeDeleted', { title: routeTitle }));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : t('libraryModal.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = async (routeId: string) => {
    try {
      setLoadingRouteId(routeId);
      await onSelectRoute(routeId);
      const route = routes.find((item) => item.id === routeId);
      if (route) {
        feedback.success(t('feedback.routeLoaded', { title: route.title }));
      }
      onClose();
    } catch (err: unknown) {
      feedback.error(err instanceof Error ? err.message : t('libraryModal.loadError'));
    } finally {
      setLoadingRouteId(null);
    }
  };

  const handleExport = async (routeId: string, routeTitle: string) => {
    try {
      setExportingId(routeId);
      const res = await fetch(`/api/routes/${routeId}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(t('libraryModal.exportError'));
      }

      const data = await res.json();
      const fullRoute: HikeRoute = data.route;
      const gpxContent = serializeToGpx(fullRoute);
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(fullRoute.title || routeTitle).replace(/[/\\?%*:|"<>]/g, '-')}.gpx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      feedback.success(t('feedback.routeExported', { title: routeTitle }));
    } catch (err: unknown) {
      console.error('Failed to export GPX:', err);
      feedback.error(err instanceof Error ? err.message : t('libraryModal.exportError'));
    } finally {
      setExportingId(null);
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
        <div className="modal-content library-modal-card">
          {/* Modal Header */}
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <div>
                <h2 id="library-modal-title" className="modal-title text-xl font-bold text-[#1b261e]">
                  {t('libraryModal.title')}
                </h2>
                <p className="text-xs text-[#576359] m-0 mt-0.5">
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
              className="error-message m-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}

          {/* Search Bar & Filter Tabs */}
          <div className="py-2.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b border-[#e5e2da] mb-3">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                <Search className="w-4 h-4 text-[#576359]" />
              </span>
              <Input
                id="library-search-input"
                type="text"
                className="pl-9 h-9 text-sm"
                placeholder={t('libraryModal.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Button
                id="tab-filter-all"
                variant={activeTab === 'all' ? 'primary' : 'secondary'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActiveTab('all')}
              >
                {t('libraryModal.tabAll', { count: routes.length })}
              </Button>
              <Button
                id="tab-filter-draft"
                variant={activeTab === 'draft' ? 'primary' : 'secondary'}
                size="sm"
                className={`h-8 text-xs ${activeTab === 'draft' ? 'bg-amber-600 border-amber-600' : ''}`}
                onClick={() => setActiveTab('draft')}
              >
                {t('libraryModal.tabDraft', { count: draftCount })}
              </Button>
              <Button
                id="tab-filter-definitive"
                variant={activeTab === 'definitive' ? 'primary' : 'secondary'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActiveTab('definitive')}
              >
                {t('libraryModal.tabDefinitive', { count: definitiveCount })}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 ml-auto shrink-0"
                onClick={fetchRoutes}
                disabled={isLoading}
                title={t('common.refresh')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="library-table-container">
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#24583d] mb-3" />
                <p className="text-sm text-[#576359]">{t('libraryModal.loading')}</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="text-center py-16 px-4 text-[#576359]">
                <span className="text-5xl block mb-3">🗺️</span>
                <p className="font-bold text-base text-[#1b261e] mb-1">
                  {routes.length === 0
                    ? t('libraryModal.emptyTitleNoRoutes')
                    : t('libraryModal.emptyTitleNoMatch')}
                </p>
                <p className="text-sm max-w-md mx-auto">
                  {routes.length === 0
                    ? t('libraryModal.emptySubtitleNoRoutes')
                    : t('libraryModal.emptySubtitleNoMatch')}
                </p>
              </div>
            ) : (
              <table id="saved-routes-table" className="library-table">
                <thead>
                  <tr>
                    <th className="w-[32%] min-w-[200px]">{t('libraryModal.thRoute')}</th>
                    <th className="w-[12%] min-w-[100px] whitespace-nowrap">{t('libraryModal.thStatus')}</th>
                    <th className="w-[12%] min-w-[105px] whitespace-nowrap">{t('libraryModal.thDistance')}</th>
                    <th className="w-[12%] min-w-[105px] whitespace-nowrap">{t('libraryModal.thStages')}</th>
                    <th className="w-[10%] min-w-[85px] whitespace-nowrap">{t('libraryModal.thPrice')}</th>
                    <th className="w-[10%] min-w-[95px] whitespace-nowrap">{t('libraryModal.thModified')}</th>
                    <th className="w-[12%] min-w-[190px] text-right whitespace-nowrap">{t('libraryModal.thActions')}</th>
                  </tr>
                </thead>
                <tbody id="saved-routes-list">
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
                      <tr
                        key={r.id}
                        className={`saved-route-item ${isSelected ? 'active-route-row' : ''}`}
                      >
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#1b261e] text-sm hover:text-[#24583d] transition-colors">
                                {r.title}
                              </span>
                              {isSelected && (
                                <Badge variant="default" className="text-[10px] py-0 px-1.5">
                                  {t('libraryModal.badgeActive')}
                                </Badge>
                              )}
                            </div>
                            {r.location && (
                              <span className="text-xs text-[#576359] flex items-center gap-1">
                                <span>📍</span>
                                <span>{r.location}</span>
                              </span>
                            )}
                            {r.description && (
                              <span className="text-xs text-[#798a80] line-clamp-1 max-w-[340px]" title={r.description}>
                                {r.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <Badge
                            variant={isDefinitive ? 'success' : 'secondary'}
                            className="whitespace-nowrap inline-flex items-center gap-1.5 py-0.5 px-2.5"
                          >
                            <span>{isDefinitive ? '🟢' : '🟡'}</span>
                            <span>{isDefinitive ? t('common.definitive') : t('common.draft')}</span>
                          </Badge>
                        </td>
                        <td>
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-[#1b261e]">
                              {formatDistance(r.totalDistanceKm)}
                            </span>
                            {r.elevationMetrics ? (
                              <span className="text-[11px] text-[#576359] font-medium whitespace-nowrap">
                                +{r.elevationMetrics.elevationGainMeters ?? 0}m / -{r.elevationMetrics.elevationLossMeters ?? 0}m
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#798a80] font-normal whitespace-nowrap">
                                —
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#f4f3ef] text-[#1b261e] font-medium border border-[#e5e2da] whitespace-nowrap">
                            <Layers className="w-3 h-3 text-[#576359]" />
                            {r.stageCount && r.stageCount > 1
                              ? t('libraryModal.stageMultiple', { count: r.stageCount })
                              : t('libraryModal.stageSingle')}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f4f3ef] text-[#1b261e] font-semibold border border-[#e5e2da] whitespace-nowrap">
                            {r.priceEur && r.priceEur > 0 ? formatPriceEur(r.priceEur) : t('common.free')}
                          </span>
                        </td>
                        <td className="text-xs text-[#576359] whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5 shrink-0 whitespace-nowrap">
                            <Button
                              id={`btn-load-route-${r.id}`}
                              variant="primary"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => handleSelect(r.id)}
                              disabled={loadingRouteId === r.id}
                              title={t('libraryModal.tooltipLoad')}
                            >
                              {loadingRouteId === r.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Map className="w-3.5 h-3.5" />
                              )}
                              <span>{loadingRouteId === r.id ? t('common.loading') : t('libraryModal.btnOpen')}</span>
                            </Button>
                            <Button
                              id={`btn-export-route-${r.id}`}
                              variant="secondary"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => handleExport(r.id, r.title)}
                              disabled={exportingId === r.id}
                              title={t('libraryModal.tooltipExport')}
                            >
                              {exportingId === r.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>{t('libraryModal.btnExport')}</span>
                            </Button>
                            <Button
                              id={`btn-edit-metadata-${r.id}`}
                              variant="secondary"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
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
                              onClick={(event) => handleDelete(r, event.currentTarget)}
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-actions justify-between pt-3 border-t border-[#e5e2da] mt-2">
            <span className="text-xs text-[#798a80]">
              {t('libraryModal.tabAll', { count: filteredRoutes.length })}
            </span>
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
      <ConfirmationModal
        isOpen={pendingDelete !== null}
        title={t('common.delete')}
        description={pendingDelete ? t('libraryModal.deleteConfirm', { title: pendingDelete.route.title }) : ''}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
        triggerElement={pendingDelete?.trigger}
      />
    </>
  );
};
