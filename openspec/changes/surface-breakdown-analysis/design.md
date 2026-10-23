## Context

See `proposal.md` for motivation and `specs/surface-analysis/spec.md` for functional requirements. The domain interfaces `SurfaceCategory` and `SurfaceBreakdown` are defined in `packages/core/src/types/index.ts`, but no algorithms or services exist to inspect OSM data, extract tags from BRouter, calculate breakdown metrics, persist breakdown in D1, or toggle colored surface segments on `MapCanvas.tsx`.

## Goals / Non-Goals

**Goals:**
- Provide a pure domain classification function `classifySurface(tags)` in `packages/core` that evaluates OSM `surface`, `tracktype`, and `highway` tags.
- Provide a BRouter message parser `parseBRouterMessages(messages)` in `packages/core` that extracts way tags along calculated routes for 0ms latency surface metrics.
- Extend `SurfaceBreakdown` with `unknownPercentage` (strict 100% total) and `segments: SurfaceSegment[]` storing categorized polylines.
- Implement `POST /api/routes/surface-analysis` in `apps/api` with coordinate downsampling and corridor Overpass queries for GPX imports.
- Implement D1 persistence with `surface_breakdown_json` in the `routes` table, persisting precomputed data on save/update.
- Build `SurfaceBreakdownCard.tsx` with a multi-segment progress bar, kilometer/percentage stats, and an interactive map view toggle.
- Update `MapCanvas.tsx` to support `activeLayerMode?: 'stages' | 'surface'`, rendering colored segments (`#22c55e` unpaved, `#f59e0b` gravel, `#64748b` paved, `#94a3b8` unknown) when surface mode is toggled.

**Non-Goals:**
- Client-side offline vector tile extraction (analysis uses BRouter messages or the corridor API endpoint, with cached results persisted in D1).
- Editing or modifying OSM tag data directly.

## Decisions

### Decision 1: Pure Domain Classification Hierarchy
In `packages/core/src/surface/classifier.ts`:
- Evaluation order:
  1. `surface` tag:
     - `unpaved`: `ground`, `earth`, `dirt`, `grass`, `sand`, `mud`, `woodchips`, `soil`, `unpaved`
     - `gravel`: `gravel`, `fine_gravel`, `compacted`, `pebblestone`, `crushed_stone`, `rock`
     - `paved`: `asphalt`, `paved`, `concrete`, `paving_stones`, `sett`, `cobblestone`, `tarmac`
  2. `tracktype` tag:
     - `grade1` -> `paved`
     - `grade2` -> `gravel`
     - `grade3`, `grade4`, `grade5` -> `unpaved`
  3. `highway` tag defaults:
     - `path`, `track`, `footway`, `bridleway` -> `unpaved`
     - `motorway`, `trunk`, `primary`, `secondary`, `tertiary`, `residential`, `cycleway`, `service` -> `paved`
  4. Fallback -> `unknown`
- *Rationale*: Matches OpenStreetMap hiking conventions and Dutch/European trail standards (Wandelnet / LAW).

### Decision 2: Direct BRouter Tag Extraction (0ms Latency)
In `packages/core/src/surface/brouter.ts`:
- BRouter GeoJSON responses include `properties.messages` containing semicolon- or space-separated key-value tags per segment (e.g. `highway=footway surface=ground`).
- `parseBRouterMessages(messages, coordinates)` extracts tags per coordinate span, classifies each sub-segment via `classifySurface()`, and constructs `SurfaceSegment[]`.
- *Rationale*: Interactive route planning in the editor gets instant surface breakdowns with zero additional network requests, eliminating latency and avoiding Overpass rate limits.

### Decision 3: Spatial Corridor Query & Cloudflare Caching for GPX Imports
In `apps/api/src/routes/surface.ts`:
- Route: `POST /api/routes/surface-analysis`
- Input: `{ coordinates: Coordinate[] }`
- Performance optimization: Downsample coordinates for corridor query (spacing ~75m–100m) to minimize Overpass payload size while maintaining high accuracy.
- Query OSM Overpass API with a 25m corridor buffer around the line.
- Cache results: Cache calculated surface breakdown in Cloudflare Worker Cache API keyed by route MD5 hash.
- Failover: 5-second timeout. If external Overpass API is unreachable or times out, fall back to highway-type heuristic and flag as estimated.

### Decision 4: Extended Data Model & Strict Mathematical Normalization
In `packages/core/src/types/index.ts` and `packages/core/src/surface/breakdown.ts`:
- Define `SurfaceSegment`:
  ```ts
  export interface SurfaceSegment {
    category: SurfaceCategory;
    coordinates: Coordinate[];
    distanceMeters: number;
  }
  ```
- Extend `SurfaceBreakdown`:
  ```ts
  export interface SurfaceBreakdown {
    unpavedMeters: number;
    gravelMeters: number;
    pavedMeters: number;
    unknownMeters: number;
    totalMeters: number;
    unpavedPercentage: number;
    gravelPercentage: number;
    pavedPercentage: number;
    unknownPercentage: number;
    segments?: SurfaceSegment[];
  }
  ```
- Rounding adjustment: Round individual percentages, compute difference from 100, and assign the delta to the largest bucket to ensure `unpavedPercentage + gravelPercentage + pavedPercentage + unknownPercentage === 100` always holds.

### Decision 5: Visual Surface Breakdown Component & Interactive Map Layer Toggle
In `apps/web/src/components/SurfaceBreakdownCard.tsx`:
- Render a segmented progress bar:
  - Green (`#22c55e`): Unpaved / Onverhard
  - Amber (`#f59e0b`): Gravel / Halfverhard
  - Slate (`#64748b`): Paved / Verhard
  - Slate-muted (`#94a3b8`): Unknown / Onbekend
- Include distance in km and percentage badges for each category.
- Provide a layer toggle button ("Toon ondergrond op kaart" / "Toon etappes") with state passed to `MapCanvas.tsx`.
- In `apps/web/src/components/MapCanvas.tsx`:
  - Add `activeLayerMode?: 'stages' | 'surface'` (default `'stages'`).
  - When in `'surface'` mode, hide or dim stage line layers and render colored GeoJSON segment polylines matching surface categories (`#22c55e`, `#f59e0b`, `#64748b`, `#94a3b8`).
  - Waypoints, transit route segments, and stage markers remain intact and interactive.

### Decision 6: D1 Database Schema Extension & Route Save Pipeline
In `apps/api/src/db/schema.ts` and `apps/api/src/routes/routes.ts`:
- Add `surfaceBreakdownJson: text('surface_breakdown_json')` to the `routes` table schema.
- Update `POST /api/routes` and `PUT /api/routes/:id` to persist `surfaceBreakdownJson`.
- When loading a route (`GET /api/routes/:id`), parse `surfaceBreakdownJson` and populate `surfaceBreakdown` on the client immediately without re-analyzing.
- If saving a route without an existing surface breakdown, trigger surface analysis automatically during the save operation.

### Decision 7: Internationalization & Localization (Policy Compliance)
In `apps/web/src/i18n/locales/nl.ts` and `en.ts`:
- Maintain 100% key parity between Dutch and English translations for all surface breakdown terms:
  - `surface.title` ("Ondergrond verdeling" / "Surface Breakdown")
  - `surface.unpaved` ("Onverhard" / "Unpaved")
  - `surface.gravel` ("Halfverhard / Grind" / "Gravel / Compacted")
  - `surface.paved` ("Verhard" / "Paved")
  - `surface.unknown` ("Onbekend" / "Unknown")
  - `surface.analyzeButton` ("Analyseer ondergrond" / "Analyze Surface")
  - `surface.analyzing` ("Ondergrond analyseren..." / "Analyzing surface...")
  - `surface.showOnMap` ("Toon ondergrond op kaart" / "Show surface on map")
  - `surface.showStages` ("Toon etappes" / "Show stages")

## Risks / Trade-offs

- **[Risk] Overpass API latency or rate limits on GPX imports**
  → *Mitigation*: BRouter tag extraction bypasses Overpass completely for planned routes. For GPX imports, downsampling coordinates, a 5s timeout, and Cloudflare Worker caching prevent blocking the user experience.
- **[Risk] Segment alignment on MapLibre canvas**
  → *Mitigation*: Segments share the exact coordinate array from the computed route geometry, ensuring zero visual gaps or misalignments when switching layer modes.
- **[Risk] Large route payloads in D1 database**
  → *Mitigation*: Surface breakdown JSON stores summary metrics and downsampled/compressed polyline segments, keeping JSON payload size well under 50KB even for multi-day 150km treks.
