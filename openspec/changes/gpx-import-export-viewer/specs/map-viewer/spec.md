## ADDED Requirements

### Requirement: Track Polyline Rendering
The map SHALL render an active route as a high-contrast GeoJSON line layer on top of base tiles, displaying distinctive start and destination markers.

#### Scenario: Route loaded onto map
- **WHEN** a route with valid coordinates is provided to the map
- **THEN** the map renders a line layer following the track coordinates and places start and end markers

### Requirement: Route Camera Fit Bounds
The map SHALL automatically adjust its viewport bounds (`fitBounds`) to encompass the full geographic bounding box of an imported route with padding.

#### Scenario: Auto-zoom to route extent
- **WHEN** a new route is imported or selected
- **THEN** the map camera smoothly animates to show the entire track within the viewport
