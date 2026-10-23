export interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
}

export type AppMode = 'planner' | 'companion';

export type SurfaceCategory = 'unpaved' | 'paved' | 'gravel' | 'unknown';

export type SurfaceAnalysisSource = 'brouter' | 'overpass' | 'unavailable';

export type SurfaceAnalysisStatus = 'complete' | 'unavailable';

export interface SurfaceSegment {
  stageId: string;
  category: SurfaceCategory;
  coordinates: Coordinate[];
  distanceMeters: number;
}

export interface SurfaceBreakdown {
  unpavedMeters: number;
  pavedMeters: number;
  gravelMeters: number;
  unknownMeters: number;
  totalMeters: number;
  unpavedPercentage: number;
  pavedPercentage: number;
  gravelPercentage: number;
  unknownPercentage: number;
  segments: SurfaceSegment[];
  source: SurfaceAnalysisSource;
  status: SurfaceAnalysisStatus;
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

export type TransportType = 'foot' | 'bus' | 'train' | 'ferry';

export interface HikeStage {
  id: string;
  stageNumber: number;
  title: string;
  distanceKm: number;
  coordinates: Coordinate[];
  notes?: string;
  transportType?: TransportType;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
}

export interface RouteElevationMetrics {
  elevationGainMeters: number;
  elevationLossMeters: number;
  minElevationMeters?: number;
  maxElevationMeters?: number;
}

export type RouteStatus = 'draft' | 'definitive';

export interface RouteMetadata {
  description?: string;
  location?: string;
  status?: RouteStatus;
  priceEur?: number;
}

export interface HikeRoute {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status?: RouteStatus;
  priceEur?: number;
  totalDistanceKm: number;
  stages: HikeStage[];
  surfaceBreakdown?: SurfaceBreakdown;
  elevationMetrics?: RouteElevationMetrics;
  createdAt: string;
  updatedAt: string;
}

export * from './auth.js';
export * from './route-planner.js';
