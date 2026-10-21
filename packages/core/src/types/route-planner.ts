import type { Coordinate } from './index.js';

export type RoutingMode = 'snap' | 'direct';

export interface RouteWaypoint {
  id: string;
  coordinate: Coordinate;
  routingMode: RoutingMode;
  name?: string;
}

export interface RouteSegment {
  id: string;
  fromWaypointId: string;
  toWaypointId: string;
  routingMode: RoutingMode;
  coordinates: Coordinate[];
  distanceMeters: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
}

export interface RouteEditorState {
  waypoints: RouteWaypoint[];
  segments: RouteSegment[];
  activeRoutingMode: RoutingMode;
  isEditing: boolean;
  selectedWaypointId?: string | null;
  canUndo: boolean;
  canRedo: boolean;
}
