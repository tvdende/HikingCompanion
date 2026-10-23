import {
  calculateHaversineDistanceKm,
  parseGpx,
  type Coordinate,
} from '@hiking-companion/core';

export interface OrderableGpxFile {
  name: string;
  start?: Coordinate;
  end?: Coordinate;
}

/** A selected GPX file, pre-parsed so the import dialog can show its details or error. */
export interface PendingGpxFile extends OrderableGpxFile {
  id: string;
  file: File;
  text: string;
  distanceKm?: number;
  trackCount?: number;
  error?: string;
}

export function preparePendingGpxFile(file: File, text: string, id: string): PendingGpxFile {
  try {
    const route = parseGpx(text, file.name.replace(/\.gpx$/i, ''), { mergeSegments: false });
    const coords = route.stages.flatMap((s) => s.coordinates);
    return {
      id,
      file,
      text,
      name: file.name,
      distanceKm: route.totalDistanceKm,
      trackCount: route.stages.length,
      start: coords[0],
      end: coords[coords.length - 1],
    };
  } catch (err) {
    return { id, file, text, name: file.name, error: err instanceof Error ? err.message : String(err) };
  }
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Stable natural sort by file name, so `etappe-2` comes before `etappe-10`. */
export function sortFilesNaturally<T extends OrderableGpxFile>(files: readonly T[]): T[] {
  return files
    .map((file, index) => ({ file, index }))
    .sort((a, b) => collator.compare(a.file.name, b.file.name) || a.index - b.index)
    .map(({ file }) => file);
}

/**
 * Suggests an order in which each file's end connects to the next file's start.
 * Builds a greedy nearest-neighbor chain from every start candidate and keeps the chain
 * with the smallest total gap; ties keep the current relative order. Files without
 * coordinates keep their relative order at the end.
 */
export function suggestFileOrder<T extends OrderableGpxFile>(files: readonly T[]): T[] {
  const located = files.filter((f) => f.start && f.end);
  const unlocated = files.filter((f) => !(f.start && f.end));
  if (located.length < 2) return [...located, ...unlocated];

  let best: T[] = located;
  let bestGap = Number.POSITIVE_INFINITY;

  for (let startIndex = 0; startIndex < located.length; startIndex++) {
    const remaining = [...located];
    const chain = remaining.splice(startIndex, 1);
    let gap = 0;
    while (remaining.length > 0) {
      const last = chain[chain.length - 1];
      let nearestIndex = 0;
      let nearestGap = Number.POSITIVE_INFINITY;
      remaining.forEach((candidate, i) => {
        const distance = calculateHaversineDistanceKm(last.end!, candidate.start!);
        if (distance < nearestGap) {
          nearestGap = distance;
          nearestIndex = i;
        }
      });
      gap += nearestGap;
      chain.push(...remaining.splice(nearestIndex, 1));
    }
    if (gap < bestGap) {
      bestGap = gap;
      best = chain;
    }
  }

  return [...best, ...unlocated];
}
