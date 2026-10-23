import type { SurfaceCategory } from '../types/index.js';

const UNPAVED_SURFACES = new Set([
  'ground',
  'earth',
  'dirt',
  'grass',
  'sand',
  'mud',
  'woodchips',
  'soil',
  'unpaved',
]);

const GRAVEL_SURFACES = new Set([
  'gravel',
  'fine_gravel',
  'compacted',
  'pebblestone',
  'crushed_stone',
  'rock',
]);

const PAVED_SURFACES = new Set([
  'asphalt',
  'paved',
  'concrete',
  'paving_stones',
  'sett',
  'cobblestone',
  'tarmac',
]);

const UNPAVED_HIGHWAYS = new Set(['path', 'track', 'footway', 'bridleway']);
const PAVED_HIGHWAYS = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'residential',
  'cycleway',
  'service',
]);

function normalizedTag(tags: Record<string, string>, key: string): string | undefined {
  const value = tags[key];
  return value?.trim().toLowerCase();
}

export function classifySurface(tags: Record<string, string>): SurfaceCategory {
  const surface = normalizedTag(tags, 'surface');
  if (surface) {
    if (UNPAVED_SURFACES.has(surface)) return 'unpaved';
    if (GRAVEL_SURFACES.has(surface)) return 'gravel';
    if (PAVED_SURFACES.has(surface)) return 'paved';
  }

  const tracktype = normalizedTag(tags, 'tracktype');
  if (tracktype === 'grade1') return 'paved';
  if (tracktype === 'grade2') return 'gravel';
  if (tracktype === 'grade3' || tracktype === 'grade4' || tracktype === 'grade5') {
    return 'unpaved';
  }

  const highway = normalizedTag(tags, 'highway');
  if (highway && UNPAVED_HIGHWAYS.has(highway)) return 'unpaved';
  if (highway && PAVED_HIGHWAYS.has(highway)) return 'paved';

  return 'unknown';
}