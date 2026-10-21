import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../apps/api/src/index.js';

describe('Routing API Proxy (/api/routing/route)', () => {
  const coordA = { lat: 52.0907, lng: 5.1214 };
  const coordB = { lat: 52.1, lng: 5.13 };

  it('rejects requests with fewer than 2 coordinates with 400 Bad Request', async () => {
    const res = await app.request('/api/routing/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: [coordA] }),
    });

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBe('At least two coordinates are required');
  });

  it('generates direct straight-line geometry when profile is straight', async () => {
    const res = await app.request('/api/routing/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [coordA, coordB],
        profile: 'straight',
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.profile).toBe('straight');
    expect(data.isFallback).toBe(false);
    expect(data.coordinates.length).toBeGreaterThan(1);
    expect(data.distanceMeters).toBeGreaterThan(0);
    expect(data.durationSeconds).toBeGreaterThan(0);
  });

  it('queries foot routing and returns path coordinates or falls back gracefully', async () => {
    const res = await app.request('/api/routing/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [coordA, coordB],
        profile: 'foot',
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.profile).toBe('foot');
    expect(Array.isArray(data.coordinates)).toBe(true);
    expect(data.coordinates.length).toBeGreaterThan(1);
    expect(data.distanceMeters).toBeGreaterThan(0);
  });

  it('falls back to straight line when external routing fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    try {
      const res = await app.request('/api/routing/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: [coordA, coordB],
          profile: 'foot',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.isFallback).toBe(true);
      expect(data.warning).toContain('straight-line fallback');
      expect(data.coordinates.length).toBeGreaterThan(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
