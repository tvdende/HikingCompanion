## Why

Long-distance hikers and trail planners need to locate essential amenities—such as drinking water, grocery stores, campings, mountain huts, hostels, and restrooms—along their hiking routes. Hikers also need to know whether supermarkets are open or closed on Sundays before relying on them for resupply. Currently, the platform allows creating and stitching routes, but has no POI scanning or amenity visualization. Implementing POI search fulfills Section 4.4 ("POI Detectie & Intelligentie") of the product vision.

## What Changes

- **OSM Overpass Corridor Search API**: Implement a Cloudflare Workers backend service `GET /api/poi` that queries OpenStreetMap Overpass API for amenities within a configurable corridor (radius 100m to 5000m) along route coordinates or around a map center point.
- **POI Categories & Data Model**: Support core outdoor amenity categories in `packages/core`:
  - `water`: drinking water fountains and spring sources
  - `supermarket`: grocery stores, bakeries, and general food markets (including parsing OSM `opening_hours`)
  - `campsite`: official campsites and bivouac zones
  - `hut`: alpine mountain huts, wilderness cabins, and trail shelters
  - `hostel`: youth hostels and budget accommodations
  - `hotel`: B&Bs, guesthouses, and hotels
  - `toilet`: public restrooms
- **Opening Hours Status & Warning**: Parse OpenStreetMap `opening_hours` tags to show real-time store availability ("Open tot 20:00", "Gesloten", Sunday closure warnings).
- **Along-the-Trail Distance Calculation**: Compute true walking distance along the route from current hiker position/trailhead to the POI turnout point, rather than misleading straight-line distance.
- **D1 Caching Layer**: Cache retrieved POIs spatially in Cloudflare D1 with TTL to minimize external Overpass API requests and prevent rate limiting.
- **Map & UI Integration**: Add interactive POI markers on MapLibre GL, category toggle chips, a searchable POI panel, and favorite pinning (pinned POIs remain visible even when their category is hidden).

## Capabilities

### New Capabilities
- `poi-search`: Corridor scanning and map-based search for hiking amenities (water, food, lodging, shelters) via OpenStreetMap Overpass API, with opening hours indicators, along-route distance computation, D1 caching, and favorite pinning.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `packages/core`: Add POI data types, category classifiers, opening hours evaluation, and along-route distance calculation.
  - `apps/api`: Add `GET /api/poi/corridor` and `GET /api/poi/bounds` endpoints, Overpass query builder, and D1 POI cache table.
  - `apps/web`: Add POI layer to MapLibre, `PoiControlPanel.tsx`, category filter chips, POI detail modal/card, and favorites management in local storage.
- **External Dependencies**: Overpass API for OSM geo-queries; lightweight `opening_hours` parsing utility.
- **Performance**: Corridor requests bounded by route bounding boxes; D1 cache prevents duplicate Overpass queries for identical trail sectors.
