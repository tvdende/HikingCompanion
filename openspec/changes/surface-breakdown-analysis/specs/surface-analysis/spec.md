## Purpose

Enriches hiking routes with surface analysis by querying OpenStreetMap way tags along the route corridor, categorizing terrain into unpaved, gravel, and paved segments, and calculating percentage and distance metrics.

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

### Requirement: Corridor Surface Analysis API
The system SHALL provide an API endpoint `POST /api/routes/surface-analysis` that takes a list of route coordinates, queries OpenStreetMap way features along the route corridor, and returns categorized path segments.

#### Scenario: Successful corridor surface analysis
- **WHEN** a client submits a valid coordinate array for an active route
- **THEN** the API queries OSM ways along the route corridor, matches coordinates to intersecting ways, and returns a structured breakdown payload with segment categories

#### Scenario: External OSM service timeout fallback
- **WHEN** the external OSM data source fails or times out
- **THEN** the API returns a graceful fallback response marking segments as `unknown` with a status flag indicating service unavailability

### Requirement: Route Surface Breakdown Calculation
The system SHALL compute total distances in meters and kilometers, as well as the exact percentage distribution for each surface category across the entire route.

#### Scenario: Accurate percentage and distance summation
- **WHEN** surface segments are computed for a route
- **THEN** the sum of individual category distances equals the total route distance, and the percentages total 100%

### Requirement: Visual Surface Breakdown Display & Map Layer
The system SHALL render:
- A surface breakdown component in the route panel displaying a segmented progress bar (green for unpaved, amber for gravel, slate for paved), kilometers, and percentage share.
- An on-demand action button ("Analyseer ondergrond") in the route panel that triggers the analysis.
- Multi-colored route segments directly on the MapLibre canvas when surface breakdown data is present (green = unpaved, orange = gravel, slate/gray = paved).

#### Scenario: Surface breakdown rendered on map and sidebar
- **WHEN** surface breakdown data is available for a route
- **THEN** the UI displays the segmented statistics in the sidebar
- **AND** the route line on the map reflects the corresponding surface colors along the trail

### Requirement: Surface Analysis Persistence in Database
The system SHALL persist the computed surface breakdown metrics and segment classifications with the route record in Cloudflare D1:
- Once analyzed, the result is saved in the database alongside the route coordinates
- When any user opens or views the route, the precomputed surface breakdown is loaded instantly from the database without re-querying external OpenStreetMap APIs

#### Scenario: Viewing a previously analyzed route
- **GIVEN** a route that has previously been analyzed and saved
- **WHEN** a user opens the route from the library or via share link
- **THEN** the surface breakdown and colored map segments are rendered immediately without issuing a new external analysis request

### Requirement: Automatic Surface Analysis on Route Save
When a user saves or updates a route (`POST /api/routes` or `PUT /api/routes/:id`):
- If the route's `surfaceBreakdown` is not yet computed or known, the backend SHALL automatically query the terrain and surface types per path segment from OpenStreetMap
- The resulting surface breakdown and colored segment classifications MUST be persisted directly in the D1 database alongside the route coordinates
- This guarantees that every saved route has permanent precomputed surface data without requiring subsequent manual analysis

#### Scenario: Saving a newly planned route without prior surface analysis
- **GIVEN** a newly drawn or uploaded GPX route where the user has not clicked "Analyseer ondergrond"
- **WHEN** the user saves the route to the database
- **THEN** the system automatically performs surface analysis per path segment in the save pipeline
- **AND** the route record in D1 is stored with the computed `surfaceBreakdown`
