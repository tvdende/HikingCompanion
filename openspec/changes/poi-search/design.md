# Design: POI Search & Amenities Detection

## Architecture & Data Flow

```
+-------------------------------------------------------------------+
|                           apps/web                                |
|  - MapLibre POI GeoJSON Layer (Icons & Popups)                    |
|  - PoiControlPanel.tsx (Category chips, Search, Radius slider)    |
|  - Favorites Pinning Store (localStorage / D1 user sync)          |
+---------------------------------+---------------------------------+
                                  |
                        HTTP GET /api/poi/corridor
                                  v
+-------------------------------------------------------------------+
|                           apps/api                                |
|  - Route corridor buffer & bounding box computation               |
|  - D1 Spatial Cache Table (`poi_cache`)                           |
|  - Overpass QL Generator (amenity, shop, tourism, shelter tags)   |
+---------------------------------+---------------------------------+
                                  |
                        External Overpass API
                                  v
+-------------------------------------------------------------------+
|               https://overpass-api.de/api/interpreter             |
+-------------------------------------------------------------------+
```

## Domain Types (`packages/core`)

```typescript
export type PoiCategory =
  | 'water'
  | 'supermarket'
  | 'campsite'
  | 'hut'
  | 'hostel'
  | 'hotel'
  | 'toilet';

export interface PointOfInterest {
  id: string;
  name: string;
  category: PoiCategory;
  coordinates: [number, number]; // [lon, lat]
  elevation?: number;
  openingHours?: string;
  isOpenNow?: boolean;
  distanceFromRouteMeters: number;
  distanceAlongRouteMeters: number;
  tags: Record<string, string>;
  isPinned?: boolean;
}

export interface PoiCorridorFilter {
  categories?: PoiCategory[];
  radiusMeters?: number; // 100 - 5000m
  onlyOpenNow?: boolean;
}
```

## D1 Cache Schema (`apps/api/src/db/schema.ts`)

```typescript
export const poiCache = sqliteTable('poi_cache', {
  id: text('id').primaryKey(), // hash(grid_cell + categories)
  gridCell: text('grid_cell').notNull(),
  categories: text('categories').notNull(),
  payloadJson: text('payload_json').notNull(),
  cachedAt: text('cached_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});
```

## Overpass Query Strategy
- Build an Overpass QL union query targeting `node` and `way` elements with `amenity=drinking_water`, `shop=supermarket|convenience`, `tourism=camp_site|alpine_hut|wilderness_hut|hostel|hotel`, and `amenity=shelter|toilets`.
- Around the route polyline, generate an `around:radius` corridor or a convex polygon / bounding box to reduce Overpass server compute time.
- Parse responses, compute perpendicular distance to route segments using Euclidean approximation of geodesic projection, and evaluate opening hours using standard timestamp checks.
