## Purpose

Enriches hiking routes with surface analysis by querying OpenStreetMap way tags along the route corridor or extracting tags directly from routing engines, categorizing terrain into unpaved, gravel, paved, and unknown segments, calculating percentage and distance metrics, persisting results in Cloudflare D1, and rendering interactive colored trail segments on the map.

## ADDED Requirements

### Requirement: OpenStreetMap Surface Tag Classification
The system SHALL classify trail segments based on OpenStreetMap `surface`, `tracktype`, and `highway` tags into normalized categories: `unpaved`, `gravel`, `paved`, and `unknown`.

#### Scenario: Classify natural forest path
- **WHEN** a way has `surface=ground`, `earth`, `dirt`, `grass`, `sand`, or `highway=path|track` without paved attributes
- **THEN** the system classifies the segment as `unpaved`

#### Scenario: Classify gravel or compacted track
- **WHEN** a way has `surface=gravel`, `fine_gravel`, `compacted`, `pebblestone`, or `tracktype=grade2`
- **THEN** the system classifies the segment as `gravel`

#### Scenario: Classify paved road or cycleway
- **WHEN** a way has `surface=asphalt`, `paved`, `concrete`, `paving_stones`, or is a primary/secondary/residential highway without unpaved tags
- **THEN** the system classifies the segment as `paved`

#### Scenario: Classify untagged or unmapped segment
- **WHEN** a coordinate segment does not match known OSM ways or lacks surface tags
- **THEN** the system classifies the segment as `unknown`

### Requirement: Surface Analysis Result Contract
The system SHALL return a completed surface analysis as a structured result containing a normalized breakdown, categorized walking segments, a data source (`brouter`, `overpass`, or `unavailable`), and availability status. The categorized segments SHALL cover all included walking geometry; portions that cannot be classified SHALL be represented as `unknown` segments.

#### Scenario: Analysis result identifies its source
- **WHEN** surface analysis completes from routing metadata or a corridor query
- **THEN** the result identifies the source used
- **AND** its categorized segments and distance totals cover the same included walking geometry

### Requirement: Direct Routing-Metadata Analysis for Planned Routes
The system SHALL preserve routing-engine surface metadata with each calculated walking segment and use that metadata to populate surface analysis without a separate corridor-analysis request when the metadata matches the supported response contract.

#### Scenario: Extract surface tags from BRouter calculation
- **GIVEN** a route calculated via BRouter
- **WHEN** BRouter returns metadata matching the supported message contract
- **THEN** the system parses the messages and assigns classified surface categories to corresponding coordinate segments
- **AND** the route's surface breakdown is populated immediately without issuing an external Overpass API request

### Requirement: Corridor Surface Analysis API for GPX Imports
The system SHALL provide an API endpoint `POST /api/routes/surface-analysis` that takes walking route geometry, queries OpenStreetMap way features along a bounded route corridor, and returns a structured surface analysis result. The endpoint SHALL reject empty or zero-length walking geometry without calling the external OSM service.

#### Scenario: Successful corridor surface analysis for imported GPX
- **WHEN** a client submits a valid coordinate array for an imported GPX track
- **THEN** the API queries OSM ways along the route corridor with a 25m buffer, deterministically matches route geometry to nearby ways, and returns a structured breakdown payload with segment categories

#### Scenario: External OSM service timeout fallback
- **WHEN** the external OSM data source fails or times out (5-second timeout)
- **THEN** the API returns a successful, unavailable analysis result in which all included walking segments are `unknown`
- **AND** the result identifies the source as unavailable so the client can distinguish it from mapped unknown terrain

### Requirement: Route Surface Breakdown Calculation with Strict Normalization
The system SHALL compute total distances in meters and kilometers, as well as the exact percentage distribution for each surface category (`unpaved`, `gravel`, `paved`, and `unknown`) across the entire route.

#### Scenario: Accurate percentage and distance summation
- **WHEN** surface segments are computed for a route
- **THEN** the sum of individual category distances (`unpavedMeters`, `gravelMeters`, `pavedMeters`, `unknownMeters`) equals the total route distance
- **AND** the percentage fields (`unpavedPercentage`, `gravelPercentage`, `pavedPercentage`, `unknownPercentage`) strictly total 100% by adjusting any fractional rounding difference into the largest category

### Requirement: Transit Exclusion and Analysis Invalidation
The system SHALL exclude transit geometry from surface distance totals and terrain coloring while retaining it, waypoints, and stage markers in every map mode. It SHALL retain a persisted analysis for metadata-only route updates and invalidate it before persistence whenever included walking geometry or stage composition changes.

#### Scenario: Metadata-only update retains analysis
- **GIVEN** a saved route with a completed surface analysis
- **WHEN** its title, description, price, or lifecycle status changes without changing walking geometry or stage composition
- **THEN** the saved surface analysis remains available without a new external analysis request

#### Scenario: Geometry update invalidates analysis
- **GIVEN** a saved route with a completed surface analysis
- **WHEN** a walking stage is added, removed, or its geometry changes
- **THEN** the prior analysis is removed before the route is persisted
- **AND** a newly requested or automatic analysis covers the updated walking geometry only

### Requirement: Visual Surface Breakdown Display & Interactive Map Layer Toggle
The system SHALL render:
- A surface breakdown component (`SurfaceBreakdownCard.tsx`) in the route panel displaying a segmented progress bar (green `#22c55e` for unpaved, amber `#f59e0b` for gravel, slate `#64748b` for paved, and slate-muted `#94a3b8` for unknown), kilometers, and percentage share.
- An interactive map layer toggle button ("Toon ondergrond op kaart" / "Toon etappes") allowing the user to switch the map rendering between stage colors and surface terrain colors.
- Multi-colored route segments rendered on `MapCanvas.tsx` when surface mode is active.

#### Scenario: Toggling map view between stages and surface mode
- **GIVEN** a route with computed surface breakdown data
- **WHEN** the user clicks "Toon ondergrond op kaart"
- **THEN** `MapCanvas.tsx` switches `activeLayerMode` to `'surface'` and displays colored trail polylines matching terrain categories
- **WHEN** the user clicks "Toon etappes"
- **THEN** `MapCanvas.tsx` switches `activeLayerMode` back to `'stages'` and displays standard stage colors while preserving transit segments and waypoints

### Requirement: Surface Analysis Persistence in Database
The system SHALL persist the computed surface breakdown metrics and segment classifications with the route record in Cloudflare D1:
- Once analyzed, the result is saved in the database column `surface_breakdown_json` alongside the route coordinates.
- When any user opens or views the route, the precomputed surface breakdown is loaded instantly from the database without re-querying external OpenStreetMap APIs.

#### Scenario: Viewing a previously analyzed route
- **GIVEN** a route that has previously been analyzed and saved in D1
- **WHEN** a user opens the route from the library or via share link
- **THEN** the surface breakdown and colored map segments are rendered immediately without issuing a new external analysis request

### Requirement: Automatic Surface Analysis on Route Save
When a user saves or updates a route (`POST /api/routes` or `PUT /api/routes/:id`):
- If the route has included walking geometry and no valid `surfaceBreakdown`, the backend SHALL automatically request surface analysis for that walking geometry.
- The resulting surface breakdown and colored segment classifications MUST be persisted directly in the D1 database alongside the route coordinates.

#### Scenario: Saving a newly planned route without prior manual surface analysis
- **GIVEN** a newly drawn or uploaded GPX route where the user has not clicked "Analyseer ondergrond"
- **WHEN** the user saves the route to the database
- **THEN** the system automatically performs surface analysis per path segment in the save pipeline
- **AND** the route record in D1 is stored with the computed `surfaceBreakdown`
