import type { Coordinate } from '../types/index.js';
import type { RoutingMode } from '../types/route-planner.js';

export interface CachedSegmentData {
  coordinates: Coordinate[];
  distanceMeters: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
}

/**
 * Normalizes coordinates to 6 decimal places (~11cm precision) to prevent
 * floating point jitter from causing cache misses.
 */
export function normalizeCoord(c: Coordinate): Coordinate {
  return {
    lat: Number(c.lat.toFixed(6)),
    lng: Number(c.lng.toFixed(6)),
    elevation: c.elevation !== undefined ? Number(c.elevation.toFixed(1)) : undefined,
  };
}

/**
 * Generates a deterministic cache key for a segment.
 */
export function generateSegmentKey(
  from: Coordinate,
  to: Coordinate,
  mode: RoutingMode
): string {
  const f = normalizeCoord(from);
  const t = normalizeCoord(to);
  const fLng = f.lng.toFixed(6);
  const fLat = f.lat.toFixed(6);
  const tLng = t.lng.toFixed(6);
  const tLat = t.lat.toFixed(6);
  return `${fLng},${fLat}_${tLng},${tLat}_${mode}`;
}

/**
 * Generates the reverse key for bidirectional path lookup.
 */
export function generateReverseSegmentKey(
  from: Coordinate,
  to: Coordinate,
  mode: RoutingMode
): string {
  return generateSegmentKey(to, from, mode);
}

/**
 * LRU bounded in-memory cache for computed route segments.
 * Supports bidirectional retrieval for foot paths (A -> B inverted when B -> A is cached).
 */
export class SegmentCache {
  private cache = new Map<string, CachedSegmentData>();
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = Math.max(1, maxSize);
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Retrieves a cached segment, supporting forward match and inverted reverse match.
   */
  get(from: Coordinate, to: Coordinate, mode: RoutingMode): CachedSegmentData | null {
    const forwardKey = generateSegmentKey(from, to, mode);
    if (this.cache.has(forwardKey)) {
      const data = this.cache.get(forwardKey)!;
      // Refresh key order for LRU eviction
      this.cache.delete(forwardKey);
      this.cache.set(forwardKey, data);
      return {
        ...data,
        coordinates: data.coordinates.map((c) => ({ ...c })),
      };
    }

    // Bidirectional lookup: foot trails are bidirectional
    const reverseKey = generateReverseSegmentKey(from, to, mode);
    if (this.cache.has(reverseKey)) {
      const revData = this.cache.get(reverseKey)!;
      // Refresh key order for LRU
      this.cache.delete(reverseKey);
      this.cache.set(reverseKey, revData);

      // Invert coordinates and swap elevation gain/loss
      const invertedCoords = revData.coordinates
        .map((c) => ({ ...c }))
        .reverse();

      return {
        coordinates: invertedCoords,
        distanceMeters: revData.distanceMeters,
        elevationGainMeters: revData.elevationLossMeters,
        elevationLossMeters: revData.elevationGainMeters,
      };
    }

    return null;
  }

  /**
   * Caches a computed segment, evicting the least recently used item if at capacity.
   */
  set(
    from: Coordinate,
    to: Coordinate,
    mode: RoutingMode,
    data: CachedSegmentData
  ): void {
    const key = generateSegmentKey(from, to, mode);

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first inserted key in Map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      ...data,
      coordinates: data.coordinates.map((c) => ({ ...c })),
    });
  }

  has(from: Coordinate, to: Coordinate, mode: RoutingMode): boolean {
    const forwardKey = generateSegmentKey(from, to, mode);
    if (this.cache.has(forwardKey)) return true;
    const reverseKey = generateReverseSegmentKey(from, to, mode);
    return this.cache.has(reverseKey);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const globalSegmentCache = new SegmentCache(1000);
