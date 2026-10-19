## Context

The foundation change initialized MapLibre GL JS and the PWA shell. Users now need the ability to load, inspect, and export standard GPX trail files. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Implement a pure TypeScript GPX 1.0/1.1 parser and serializer in `packages/core` capable of extracting track points, elevation, and metadata.
- Calculate total 3D geodesic distance, cumulative elevation gain (+), and cumulative elevation loss (-).
- Render tracks as GeoJSON `LineString` layers in MapLibre GL with start (green) and end (red) waypoint markers.
- Implement camera `fitBounds` to auto-zoom to the loaded track boundaries.
- Provide file upload (file input and drag-and-drop) and a "Download GPX" export action in `apps/web`.

**Non-Goals:**
- Snapping points to trails or calculating OpenStreetMap surface types (deferred to Change 3).
- Persisting routes to Cloudflare D1 database (deferred to Change 4).
- Turn-by-turn routing audio prompts (deferred to Companion live navigation change).

## Decisions

### 1. GPX Engine in `packages/core`
- **Choice**: Cross-environment XML parser implemented in `packages/core`.
- **Rationale**: Using lightweight XML parsing compatible with both browser (DOMParser) and serverless/Node environments allows route parsing on both client and API without heavy dependencies.
- **Alternatives considered**: `togeojson` / `gpxparser` npm libraries (rejected to maintain KISS, avoid obsolete dependencies, and adhere to strict TypeScript domain models).

### 2. MapLibre GeoJSON Layer Architecture
- **Choice**: Dynamic GeoJSON source (`route-source`) and line layer (`route-layer`) added to MapLibre GL canvas.
- **Styling**: `#0284c7` (primary brand color) with width 4, round caps and joins, and a subtle drop shadow or casing layer (`#0f172a`, width 6) for maximum visibility against varied satellite/osm terrain.

### 3. Geodesic & Elevation Calculations
- **Choice**: Distance calculated using Haversine algorithm across consecutive coordinate pairs. Elevation delta threshold of 1 meter to filter GPS elevation jitter.

## Risks / Trade-offs

- **[Risk] High-density GPS recordings (thousands of track points) causing UI jank**  
  → **Mitigation**: MapLibre GL JS renders GeoJSON polylines directly on the GPU via WebGL; tracks with up to 20,000 coordinates render smoothly at 60 FPS.
- **[Risk] GPX files lacking elevation tags (`<ele>`)**  
  → **Mitigation**: The parser treats elevation as optional (`elevation?: number`) and gracefully falls back to 2D distance calculation and displays "0 m / N/A" for elevation metrics.
