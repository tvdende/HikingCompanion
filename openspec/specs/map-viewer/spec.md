# map-viewer Specification

## Purpose
Renders an interactive map canvas using MapLibre GL JS with OpenStreetMap base tiles, standard navigation controls, and user geolocation visualization.

## Requirements

### Requirement: Interactive Map Canvas
The application SHALL render an interactive map using MapLibre GL JS that loads OpenStreetMap tile layers fullscreen.

#### Scenario: Map initial render
- **WHEN** the application view is loaded
- **THEN** the map canvas is initialized and visible with pan and zoom capabilities

### Requirement: Map Navigation Controls
The map SHALL provide interactive navigation controls for zooming in, zooming out, and resetting compass bearing.

#### Scenario: Zooming the map
- **WHEN** the user clicks the zoom-in control
- **THEN** the map view zoom level increases smoothly

### Requirement: User Geolocation Tracking
The map SHALL provide a geolocation trigger to center the map on the user's current GPS position when permission is granted.

#### Scenario: Locate user position
- **WHEN** the user activates the geolocation button and browser geolocation permission is granted
- **THEN** the map centers on the user's coordinates and displays a current location marker

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

