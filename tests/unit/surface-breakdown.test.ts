import { describe, expect, it } from 'vitest';
import { calculateSurfaceBreakdown, type SurfaceSegment } from '@hiking-companion/core';

const coordinate = { lat: 52, lng: 5 };

describe('calculateSurfaceBreakdown', () => {
  it('normalizes rounded percentages to 100', () => {
    const segments: SurfaceSegment[] = ['unpaved', 'gravel', 'paved'].map((category) => ({
      stageId: 'stage-1', category: category as SurfaceSegment['category'], coordinates: [coordinate, coordinate], distanceMeters: 1,
    }));
    const result = calculateSurfaceBreakdown(segments);
    expect(result.unpavedPercentage + result.gravelPercentage + result.pavedPercentage + result.unknownPercentage).toBe(100);
  });

  it('rejects zero-length analysis', () => {
    expect(() => calculateSurfaceBreakdown([])).toThrow('non-zero geometry');
  });
});