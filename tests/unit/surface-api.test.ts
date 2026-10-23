import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../../apps/api/src/index.js';
import { analyzeRouteSurface } from '../../apps/api/src/routes/surface.js';

const coordinates = [{ lat: 52.09, lng: 5.12 }, { lat: 52.091, lng: 5.121 }];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Surface analysis API', () => {
  it('rejects invalid geometry without fetching Overpass', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates: [{ lat: 52, lng: 5 }] }),
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an empty coordinate array without fetching Overpass', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates: [] }),
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a classified Overpass result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      elements: [{ id: 3, tags: { surface: 'gravel' }, geometry: [{ lat: 52.09, lon: 5.12 }] }],
    }), { status: 200 })));
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates, stageId: 'walking-1' }),
    });
    const data = await response.json() as any;
    expect(data.surfaceBreakdown.source).toBe('overpass');
    expect(data.surfaceBreakdown.segments[0].category).toBe('gravel');
  });

  it('uses a cached result without fetching Overpass', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('caches', { default: { match: vi.fn().mockResolvedValue(new Response(JSON.stringify({ source: 'overpass', status: 'complete', segments: [] }))), put: vi.fn() } });
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates }),
    });
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the lower OSM way id when nearby ways are equally close', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      elements: [
        { id: 9, tags: { surface: 'gravel' }, geometry: [{ lat: 52.09, lon: 5.12 }] },
        { id: 3, tags: { surface: 'asphalt' }, geometry: [{ lat: 52.09, lon: 5.12 }] },
      ],
    }), { status: 200 })));
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates }),
    });
    expect((await response.json() as any).surfaceBreakdown.segments[0].category).toBe('paved');
  });

  it('returns unavailable unknown segments when Overpass fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates }),
    });
    const result = (await response.json() as any).surfaceBreakdown;
    expect(result.status).toBe('unavailable');
    expect(result.unknownPercentage).toBe(100);
  });

  it('falls back to BRouter when Overpass is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('overpass-api.de')) return Promise.reject(new Error('Overpass timeout'));
      if (url.includes('brouter.de')) {
        return Promise.resolve(new Response(JSON.stringify({
          features: [{
            geometry: { coordinates: [[5.12, 52.09], [5.121, 52.091]] },
            properties: {
              messages: [
                ['Longitude', 'Latitude', 'WayTags'],
                ['5121000', '52090000', 'surface=gravel highway=footway'],
                ['5121000', '52091000', 'surface=gravel highway=footway'],
              ],
            },
          }],
        }), { status: 200 }));
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    }));

    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates, stageId: 'walking-1' }),
    });

    const result = (await response.json() as any).surfaceBreakdown;
    expect(result.source).toBe('brouter');
    expect(result.status).toBe('complete');
    expect(result.segments[0].category).toBe('gravel');
  });

  it('analyzes each supplied walking stage independently', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      elements: [{ id: 3, tags: { surface: 'gravel' }, geometry: [{ lat: 52.09, lon: 5.12 }] }],
    }), { status: 200 })));
    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stages: [
          { id: 'walk-1', stageNumber: 1, title: 'Walk 1', distanceKm: 1, coordinates },
          { id: 'train', stageNumber: 2, title: 'Train', distanceKm: 1, coordinates, transportType: 'train' },
          { id: 'walk-2', stageNumber: 3, title: 'Walk 2', distanceKm: 1, coordinates },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const result = (await response.json() as { surfaceBreakdown: { segments: Array<{ stageId: string }> } }).surfaceBreakdown;
    expect(result.segments.map((segment) => segment.stageId)).toEqual(['walk-1', 'walk-2']);
  });

  it('splits long corridors into bounded Overpass requests', async () => {
    const longCoordinates = Array.from({ length: 32 }, (_, index) => ({
      lat: 52 + index * 0.001,
      lng: 5,
    }));
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ elements: [] }), { status: 200 }))
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.request('/api/routes/surface-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: longCoordinates, stageId: 'long-walk' }),
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('excludes transit stages from route-wide analysis', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const result = await analyzeRouteSurface([
      { id: 'walk', stageNumber: 1, title: 'Walk', distanceKm: 1, coordinates, transportType: 'foot' },
      { id: 'train', stageNumber: 2, title: 'Train', distanceKm: 1, coordinates, transportType: 'train' },
    ]);
    expect(result?.segments.every((segment) => segment.stageId === 'walk')).toBe(true);
  });
});