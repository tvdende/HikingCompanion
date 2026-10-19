export interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
}

export type AppMode = 'planner' | 'companion';

export type SurfaceCategory = 'unpaved' | 'paved' | 'gravel' | 'unknown';

export interface SurfaceBreakdown {
  unpavedMeters: number;
  pavedMeters: number;
  gravelMeters: number;
  unknownMeters: number;
  unpavedPercentage: number;
  pavedPercentage: number;
  gravelPercentage: number;
}

export type PoiCategory = 'supermarket' | 'camping' | 'hostel' | 'hotel';

export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
  coordinate: Coordinate;
  openingHours?: string;
  isFavorite?: boolean;
}

export interface HikeStage {
  id: string;
  stageNumber: number;
  title: string;
  distanceKm: number;
  coordinates: Coordinate[];
}

export interface RouteElevationMetrics {
  elevationGainMeters: number;
  elevationLossMeters: number;
  minElevationMeters?: number;
  maxElevationMeters?: number;
}

export interface HikeRoute {
  id: string;
  title: string;
  totalDistanceKm: number;
  stages: HikeStage[];
  surfaceBreakdown?: SurfaceBreakdown;
  elevationMetrics?: RouteElevationMetrics;
  createdAt: string;
  updatedAt: string;
}

export * from './auth.js';
