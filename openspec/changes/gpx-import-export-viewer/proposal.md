## Why

Hikers and planners need to load their existing trail files (GPX) into the application to inspect routes, view elevation profiles, and see route metrics before undertaking a hike. Adding robust GPX import, parsing, visualization, and export capabilities turns the map shell into a functional trail viewer, serving as the prerequisite for subsequent route editing, surface analysis, and navigation features.

## What Changes

- **Core GPX Engine (`packages/core`)**: Pure TypeScript parser and serializer for standard GPX 1.1 format:
  - Extracts track points (`<trkpt>`), coordinates (latitude, longitude), elevation (`<ele>`), and timestamps (`<time>`).
  - Computes cumulative trail metrics: total distance (km), elevation gain (+m), and elevation loss (-m).
  - Serializes `HikeRoute` models back into valid GPX XML files for download/export.
- **Track Visualization on Map (`map-viewer`)**:
  - Renders GeoJSON line layers on the MapLibre GL canvas representing the hike track with distinct adventure styling.
  - Adds distinctive start (green) and destination (red) trail markers.
  - Automatically adjusts the map camera viewport (`fitBounds`) to encompass the imported track.
- **PWA File Upload & Metrics Overlay**:
  - File picker and drag-and-drop support for `.gpx` files in the web UI.
  - Elevation and distance summary cards in Planner Mode displaying total distance, elevation profile, and point counts.
  - "Download GPX" export button to save the route to the local device.

## Capabilities

### New Capabilities
- `gpx-engine`: Parsing, metric calculation (distance, elevation gain/loss), and XML serialization for standard GPX 1.1 trail files.

### Modified Capabilities
- `map-viewer`: Adds track polyline rendering, start/finish waypoint markers, and automated camera viewport bounds fitting for loaded routes.

## Impact

- Extends `packages/core` with parser and serializer modules and corresponding Vitest unit tests.
- Extends `apps/web` with file upload triggers, track layer rendering in `MapCanvas`, and route statistics display.
- Validates E2E upload flow with Playwright.
