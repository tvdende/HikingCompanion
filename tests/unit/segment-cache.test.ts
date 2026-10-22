import { describe, it, expect } from 'vitest';
import {
  SegmentCache,
  generateSegmentKey,
  generateReverseSegmentKey,
  normalizeCoord,
} from '@hiking-companion/core';

describe('SegmentCache Utility', () => {
  const coordA = { lat: 52.0000001, lng: 5.0000002 };
  const coordB = { lat: 52.0500001, lng: 5.0500002 };
  const samplePolyline = [
    { lat: 52.000000, lng: 5.000000, elevation: 10 },
    { lat: 52.025000, lng: 5.025000, elevation: 25 },
    { lat: 52.050000, lng: 5.050000, elevation: 40 },
  ];

  it('normalizes coordinates to 6 decimal places (~11cm precision)', () => {
    const norm = normalizeCoord({ lat: 52.12345678, lng: 5.87654321, elevation: 12.34 });
    expect(norm.lat).toBe(52.123457);
    expect(norm.lng).toBe(5.876543);
    expect(norm.elevation).toBe(12.3);
  });

  it('generates consistent deterministic segment keys', () => {
    const key1 = generateSegmentKey(coordA, coordB, 'snap');
    const key2 = generateSegmentKey(
      { lat: 52.0, lng: 5.0 },
      { lat: 52.05, lng: 5.05 },
      'snap'
    );
    expect(key1).toBe('5.000000,52.000000_5.050000,52.050000_snap');
    expect(key2).toBe('5.000000,52.000000_5.050000,52.050000_snap');
    expect(key1).toBe(key2);
  });

  it('generates accurate reverse keys', () => {
    const revKey = generateReverseSegmentKey(coordA, coordB, 'snap');
    expect(revKey).toBe('5.050000,52.050000_5.000000,52.000000_snap');
  });

  it('stores and retrieves segments via forward key', () => {
    const cache = new SegmentCache(10);
    cache.set(coordA, coordB, 'snap', {
      coordinates: samplePolyline,
      distanceMeters: 5200,
      elevationGainMeters: 30,
      elevationLossMeters: 0,
    });

    expect(cache.has(coordA, coordB, 'snap')).toBe(true);
    const retrieved = cache.get(coordA, coordB, 'snap');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.distanceMeters).toBe(5200);
    expect(retrieved?.coordinates).toHaveLength(3);
    expect(retrieved?.coordinates[0].lat).toBe(52.000000);
  });

  it('retrieves inverted segment via bidirectional lookup when reverse is cached', () => {
    const cache = new SegmentCache(10);
    // Cache A -> B
    cache.set(coordA, coordB, 'snap', {
      coordinates: samplePolyline,
      distanceMeters: 5200,
      elevationGainMeters: 30,
      elevationLossMeters: 5,
    });

    // Query B -> A
    expect(cache.has(coordB, coordA, 'snap')).toBe(true);
    const retrievedRev = cache.get(coordB, coordA, 'snap');
    expect(retrievedRev).not.toBeNull();
    expect(retrievedRev?.distanceMeters).toBe(5200);
    // Should have inverted order: first coordinate is now (52.05, 5.05)
    expect(retrievedRev?.coordinates[0].lat).toBe(52.050000);
    expect(retrievedRev?.coordinates[2].lat).toBe(52.000000);
    // Elevation gain and loss should be inverted
    expect(retrievedRev?.elevationGainMeters).toBe(5);
    expect(retrievedRev?.elevationLossMeters).toBe(30);
  });

  it('evicts least recently used items when capacity is exceeded', () => {
    const cache = new SegmentCache(3);
    const p1 = { lat: 52.01, lng: 5.01 };
    const p2 = { lat: 52.02, lng: 5.02 };
    const p3 = { lat: 52.03, lng: 5.03 };
    const p4 = { lat: 52.04, lng: 5.04 };

    cache.set(p1, p2, 'snap', { coordinates: [p1, p2], distanceMeters: 100 });
    cache.set(p2, p3, 'snap', { coordinates: [p2, p3], distanceMeters: 100 });
    cache.set(p3, p4, 'snap', { coordinates: [p3, p4], distanceMeters: 100 });
    expect(cache.size).toBe(3);

    // Access p1 -> p2 so it becomes most recently used
    cache.get(p1, p2, 'snap');

    // Add 4th item, should evict p2 -> p3 (which is now oldest)
    const p5 = { lat: 52.05, lng: 5.05 };
    cache.set(p4, p5, 'snap', { coordinates: [p4, p5], distanceMeters: 100 });

    expect(cache.size).toBe(3);
    expect(cache.has(p1, p2, 'snap')).toBe(true);
    expect(cache.has(p2, p3, 'snap')).toBe(false); // evicted!
    expect(cache.has(p3, p4, 'snap')).toBe(true);
    expect(cache.has(p4, p5, 'snap')).toBe(true);
  });
});
