# Capability: POI Search & Amenities Detection

## Purpose

Enable hikers and planners to discover, inspect, and filter essential amenities (water, food resupply, shelter, campsites, sanitary facilities) along their route corridor or visible map area, with opening hours indicators, route-aligned distance measurements, and local caching.

## Requirements

### Requirement: POI Category Classification & Data Model
The system SHALL classify OpenStreetMap nodes and ways into standardized POI categories:
- `water`: `amenity=drinking_water`, `natural=spring`, `man_made=water_tap`
- `supermarket`: `shop=supermarket`, `shop=convenience`, `shop=bakery`, `shop=general`
- `campsite`: `tourism=camp_site`, `tourism=camp_pitch`, `backcountry=yes`
- `hut`: `tourism=alpine_hut`, `tourism=wilderness_hut`, `amenity=shelter`
- `hostel`: `tourism=hostel`
- `hotel`: `tourism=hotel`, `tourism=guest_house`, `tourism=motel`
- `toilet`: `amenity=toilets`

Each POI entity MUST contain:
- `id`: unique OSM identifier
- `name`: string name or generic label if unnamed
- `category`: one of the standardized POI categories
- `coordinates`: `[longitude, latitude]`
- `elevation`: optional elevation in meters
- `openingHours`: optional raw OSM opening hours string
- `isOpenNow`: optional boolean indicating whether the facility is currently open
- `distanceFromRouteMeters`: distance from the nearest point on the active route
- `distanceAlongRouteMeters`: cumulative trail distance from the start of the route to the POI turnout point

#### Scenario: Categorizing a drinking water fountain
- GIVEN an OSM node with tags `{"amenity": "drinking_water", "name": "Bergbrunnen"}`
- WHEN the POI classifier processes the node
- THEN the POI category MUST be `water`
- AND the display name MUST be `"Bergbrunnen"`

### Requirement: Corridor & Bounds Overpass Querying
The backend API SHALL expose:
- `GET /api/poi/corridor`: accepts route polyline or coordinates and an optional `radiusMeters` (default: 500m, min: 100m, max: 5000m) and returns matching POIs within the corridor
- `GET /api/poi/bounds`: accepts bounding box coordinates `minLon,minLat,maxLon,maxLat` and returns POIs within the view rectangle

The frontend UI SHALL trigger corridor POI queries on-demand via a dedicated "Zoek voorzieningen" action button in the route panel to conserve mobile data and prevent unnecessary external API load.

#### Scenario: Searching amenities within 500m of a hiking track
- GIVEN a hiking route with coordinates spanning a 12 km mountain pass
- WHEN the user clicks "Zoek voorzieningen" in the route panel
- THEN the API returns all POIs located within 500 meters of the trail track

### Requirement: Opening Hours & Resupply Warnings
The system SHALL evaluate OSM `opening_hours` for grocery shops, supermarkets, and bakeries:
- Display whether the venue is currently open, closed, or closing soon
- Provide a clear warning badge when a food resupply point is closed on Sundays or during public holidays

#### Scenario: Resupply store closed on Sunday
- GIVEN a supermarket with `opening_hours = "Mo-Sa 08:00-19:00; Su off"`
- WHEN evaluated on a Sunday
- THEN `isOpenNow` MUST be false
- AND the UI MUST display a warning that the store is closed on Sunday

### Requirement: Along-the-Route Distance Measurement
The system SHALL calculate the true hiking distance along the route to each POI:
- Find the closest perpendicular projection on the route geometry
- Compute the distance from route start (or user's current GPS position) to that projection point
- Add the detour distance from the projection point to the POI coordinates

#### Scenario: Calculating trail detour distance
- GIVEN an active route of 20 km
- AND a campsite located 300 meters off the trail at kilometer 14.5
- WHEN along-route distance is calculated from the start
- THEN `distanceAlongRouteMeters` MUST equal 14,500 meters
- AND `distanceFromRouteMeters` MUST equal 300 meters

### Requirement: D1 POI Spatial Caching
The backend SHALL cache retrieved POIs in Cloudflare D1:
- Cache key derived from spatial grid cells (e.g. 0.05 degree bounding box tiles) and category filters
- Cache expiration (TTL) of 7 days to maintain freshness while preventing duplicate Overpass load

#### Scenario: Cache hit on popular hiking sector
- GIVEN an Overpass query already executed for a trail sector within the past 7 days
- WHEN a subsequent request queries the same corridor
- THEN the API MUST serve results from D1 without issuing a remote HTTP request to Overpass

### Requirement: Interactive Map Controls & Favorite Pinning
The frontend UI SHALL:
- Render distinct category icons and color badges on the MapLibre canvas
- Provide toggle chips to show/hide specific POI categories
- Allow hikers to "Pin" (favorite) critical POIs so they stay visible even when their category filter is toggled off
- Display a quick POI drawer listing amenities sorted by trail distance
