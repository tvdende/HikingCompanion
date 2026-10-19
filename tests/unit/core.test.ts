import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceKm, isValidCoordinate } from '@hiking-companion/core';
import type { Coordinate, Poi, AppMode } from '@hiking-companion/core';

describe('Core Domain Calculations', () => {
  it('calculates the Haversine distance correctly between two points', () => {
    // Utrecht Dom Tower to Amersfoort Onze Lieve Vrouwetoren (~20 km)
    const utrecht: Coordinate = { lat: 52.0907, lng: 5.1214 };
    const amersfoort: Coordinate = { lat: 52.1561, lng: 5.3878 };

    const distance = calculateHaversineDistanceKm(utrecht, amersfoort);
    expect(distance).toBeGreaterThan(19);
    expect(distance).toBeLessThan(21);
  });

  it('returns 0 km when calculating distance between identical coordinates', () => {
    const point: Coordinate = { lat: 52.0907, lng: 5.1214 };
    expect(calculateHaversineDistanceKm(point, point)).toBe(0);
  });
});

describe('Coordinate Validation', () => {
  it('identifies valid coordinates', () => {
    expect(isValidCoordinate({ lat: 52.09, lng: 5.12 })).toBe(true);
    expect(isValidCoordinate({ lat: -90, lng: 180 })).toBe(true);
    expect(isValidCoordinate({ lat: 0, lng: 0 })).toBe(true);
  });

  it('rejects invalid latitude and longitude values', () => {
    expect(isValidCoordinate({ lat: 95, lng: 5.12 })).toBe(false);
    expect(isValidCoordinate({ lat: 52, lng: 185 })).toBe(false);
    expect(isValidCoordinate({ lat: 'invalid', lng: 5.12 })).toBe(false);
    expect(isValidCoordinate(null)).toBe(false);
  });
});

describe('Domain Models Consistency', () => {
  it('constructs a valid POI object according to core types', () => {
    const poi: Poi = {
      id: 'poi-1',
      name: 'Supermarkt De Spar',
      category: 'supermarket',
      coordinate: { lat: 52.09, lng: 5.12 },
      openingHours: 'Mo-Sa 08:00-20:00',
      isFavorite: true
    };

    expect(poi.category).toBe('supermarket');
    expect(poi.isFavorite).toBe(true);
  });

  it('supports app mode states', () => {
    const plannerMode: AppMode = 'planner';
    const companionMode: AppMode = 'companion';
    expect(plannerMode).not.toBe(companionMode);
  });
});
