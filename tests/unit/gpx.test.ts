import { describe, it, expect } from 'vitest';
import {
  parseGpx,
  serializeToGpx,
  calculateRouteMetrics,
  calculateHaversineDistanceKm,
} from '@hiking-companion/core';
import type { Coordinate, HikeRoute } from '@hiking-companion/core';

describe('GPX Parser & Metrics Calculator', () => {
  const sampleGpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Hiking Companion Test" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Utrechtse Heuvelrug Trail</name>
  </metadata>
  <trk>
    <name>Etappe 1: Driebergen naar Doorn</name>
    <trkseg>
      <trkpt lat="52.0543" lon="5.2812">
        <ele>12.5</ele>
      </trkpt>
      <trkpt lat="52.0498" lon="5.3120">
        <ele>35.0</ele>
      </trkpt>
      <trkpt lat="52.0354" lon="5.3489">
        <ele>22.0</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  it('parses GPX 1.1 XML into a structured HikeRoute object', () => {
    const route = parseGpx(sampleGpxXml);

    expect(route.title).toBe('Utrechtse Heuvelrug Trail');
    expect(route.stages).toHaveLength(1);
    expect(route.stages[0].coordinates).toHaveLength(3);

    const firstPoint = route.stages[0].coordinates[0];
    expect(firstPoint.lat).toBe(52.0543);
    expect(firstPoint.lng).toBe(5.2812);
    expect(firstPoint.elevation).toBe(12.5);

    expect(route.totalDistanceKm).toBeGreaterThan(0);
    expect(route.elevationMetrics).toBeDefined();
    expect(route.elevationMetrics?.elevationGainMeters).toBeGreaterThan(0);
    expect(route.elevationMetrics?.elevationLossMeters).toBeGreaterThan(0);
  });

  it('calculates elevation gain, loss, and min/max elevation accurately', () => {
    const coords: Coordinate[] = [
      { lat: 52.0, lng: 5.0, elevation: 10 },
      { lat: 52.01, lng: 5.01, elevation: 30 }, // +20m
      { lat: 52.02, lng: 5.02, elevation: 15 }, // -15m
      { lat: 52.03, lng: 5.03, elevation: 40 }, // +25m (total gain: 45m, total loss: 15m)
    ];

    const metrics = calculateRouteMetrics(coords);

    expect(metrics.elevationMetrics.elevationGainMeters).toBe(45);
    expect(metrics.elevationMetrics.elevationLossMeters).toBe(15);
    expect(metrics.elevationMetrics.minElevationMeters).toBe(10);
    expect(metrics.elevationMetrics.maxElevationMeters).toBe(40);
    expect(metrics.pointCount).toBe(4);
  });

  it('filters elevation jitter smaller than threshold', () => {
    const coordsWithJitter: Coordinate[] = [
      { lat: 52.0, lng: 5.0, elevation: 100.0 },
      { lat: 52.001, lng: 5.001, elevation: 100.2 }, // 0.2m jitter -> ignored
      { lat: 52.002, lng: 5.002, elevation: 99.9 },  // jitter -> ignored
      { lat: 52.01, lng: 5.01, elevation: 110.0 },   // +10m gain
    ];

    const metrics = calculateRouteMetrics(coordsWithJitter);
    expect(metrics.elevationMetrics.elevationGainMeters).toBe(10);
  });

  it('throws descriptive error on malformed or empty GPX inputs', () => {
    expect(() => parseGpx('')).toThrow(/niet-lege string/);
    expect(() => parseGpx('<div>Hello World</div>')).toThrow(/<gpx> ontbreekt/);
    expect(() => parseGpx('<gpx><trk><name>Empty</name></trk></gpx>')).toThrow(/Geen geldige GPS trackpunten/);
  });

  it('supports GPX route points (<rtept>) as fallback', () => {
    const routeGpx = `<gpx version="1.1">
      <rte>
        <name>Wandelroute</name>
        <rtept lat="52.1" lon="5.1"><ele>50</ele></rtept>
        <rtept lat="52.2" lon="5.2"><ele>60</ele></rtept>
      </rte>
    </gpx>`;

    const parsed = parseGpx(routeGpx);
    expect(parsed.title).toBe('Wandelroute');
    expect(parsed.stages[0].coordinates).toHaveLength(2);
    expect(parsed.stages[0].coordinates[0].lat).toBe(52.1);
  });

  it('serializes HikeRoute to valid GPX XML with lossless round-trip', () => {
    const originalRoute: HikeRoute = {
      id: 'route-test-1',
      title: 'Pieterpad Etappe & Test <1>',
      totalDistanceKm: 18.5,
      stages: [
        {
          id: 'stage-1',
          stageNumber: 1,
          title: 'Etappe 1',
          distanceKm: 18.5,
          coordinates: [
            { lat: 53.3, lng: 6.5, elevation: 10.5 },
            { lat: 53.35, lng: 6.55, elevation: 25.0 },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const gpxXml = serializeToGpx(originalRoute);
    expect(gpxXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpxXml).toContain('<gpx version="1.1"');
    expect(gpxXml).toContain('&lt;1&gt;'); // XML escaped
    expect(gpxXml).toContain('<trkpt lat="53.300000" lon="6.500000">');
    expect(gpxXml).toContain('<ele>10.5</ele>');

    // Re-parse the serialized XML
    const reParsed = parseGpx(gpxXml);
    expect(reParsed.stages[0].coordinates).toHaveLength(2);
    expect(reParsed.stages[0].coordinates[0].lat).toBeCloseTo(53.3, 5);
    expect(reParsed.stages[0].coordinates[0].lng).toBeCloseTo(6.5, 5);
    expect(reParsed.stages[0].coordinates[0].elevation).toBe(10.5);
  });
});
