import { useEffect, useState } from 'react';

export type LayoutTier = 'compact' | 'medium' | 'wide';

/** Breakpoints of the planner layout tiers; keep in sync with the media queries in index.css. */
export const LAYOUT_TIER_QUERIES = {
  compact: '(max-width: 767.98px)',
  wide: '(min-width: 1200px)',
} as const;

export function getLayoutTier(): LayoutTier {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'wide';
  if (window.matchMedia(LAYOUT_TIER_QUERIES.compact).matches) return 'compact';
  if (window.matchMedia(LAYOUT_TIER_QUERIES.wide).matches) return 'wide';
  return 'medium';
}

/** Width of the planner sidebar for a tier: on medium screens it never takes more than 45vw. */
export function effectiveSidebarWidth(storedWidth: number, tier: LayoutTier): number {
  if (tier !== 'medium' || typeof window === 'undefined') return storedWidth;
  return Math.round(Math.max(320, Math.min(storedWidth, window.innerWidth * 0.45)));
}

/** Current layout tier (compact < 768px, medium 768–1199px, wide ≥ 1200px), updated on resize. */
export function useLayoutTier(): LayoutTier {
  const [tier, setTier] = useState<LayoutTier>(getLayoutTier);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const queries = Object.values(LAYOUT_TIER_QUERIES).map((q) => window.matchMedia(q));
    const update = () => setTier(getLayoutTier());
    queries.forEach((q) => q.addEventListener('change', update));
    update();
    return () => queries.forEach((q) => q.removeEventListener('change', update));
  }, []);

  return tier;
}
