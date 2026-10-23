import type { SurfaceBreakdown } from '@hiking-companion/core';
import { Map, Mountain } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Button } from './ui/button';

interface SurfaceBreakdownCardProps {
  breakdown?: SurfaceBreakdown;
  isAnalyzing?: boolean;
  isSurfaceMode: boolean;
  onAnalyze: () => void;
  onToggleMap: () => void;
}

const categories = [
  ['unpaved', '#22c55e'],
  ['gravel', '#f59e0b'],
  ['paved', '#64748b'],
  ['unknown', '#94a3b8'],
] as const;

export function SurfaceBreakdownCard({ breakdown, isAnalyzing, isSurfaceMode, onAnalyze, onToggleMap }: SurfaceBreakdownCardProps) {
  const { t } = useTranslation();
  if (!breakdown) {
    return <Button variant="secondary" size="sm" onClick={onAnalyze} disabled={isAnalyzing}>
      <Mountain className="w-4 h-4" />{isAnalyzing ? t('surface.analyzing') : t('surface.analyzeButton')}
    </Button>;
  }
  const values = breakdown as unknown as Record<string, number>;

  return <section className="mt-3 border border-[#e5e2da] bg-white p-3 rounded-lg" aria-label={t('surface.title')}>
    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
      <h4 className="text-sm font-bold m-0">{t('surface.title')}</h4>
      <Button variant="secondary" size="sm" onClick={onToggleMap} title={isSurfaceMode ? t('surface.showStages') : t('surface.showOnMap')}>
        <Map className="w-4 h-4" />{isSurfaceMode ? t('surface.showStages') : t('surface.showOnMap')}
      </Button>
    </div>
    {breakdown.status === 'unavailable' && <p className="text-xs text-[#a16207] m-0 mb-2">{t('surface.unavailable')}</p>}
    <div className="h-2 flex overflow-hidden rounded-sm mb-2">
      {categories.map(([category, color]) => <span key={category} style={{ width: `${values[`${category}Percentage`]}%`, backgroundColor: color }} />)}
    </div>
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {categories.map(([category, color]) => <div key={category} className="flex justify-between gap-1"><span style={{ color }} className="font-semibold">{t(`surface.${category}`)}</span><span>{(values[`${category}Meters`] / 1000).toFixed(1)} {t('common.km')} · {values[`${category}Percentage`]}%</span></div>)}
    </div>
  </section>;
}