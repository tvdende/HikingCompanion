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

### Requirement: Visual Surface Breakdown Display
The system SHALL render a surface breakdown component in the route planner view presenting a segmented, multi-colored progress bar (green for unpaved, amber for gravel, slate for paved) and summary statistics.

#### Scenario: Surface breakdown rendered for loaded route
- **WHEN** a route with surface breakdown metrics is active in the planner
- **THEN** the UI displays the segmented color bar and lists kilometers and percentages for each category

#### Scenario: Surface breakdown loading and skeleton state
- **WHEN** surface analysis is in progress for a newly imported or modified route
- **THEN** the UI displays a subtle loading skeleton without blocking map interaction
