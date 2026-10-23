## Context

See `proposal.md` for motivation and `specs/surface-analysis/spec.md` for functional requirements. The domain interfaces `SurfaceCategory` and `SurfaceBreakdown` are defined in `packages/core/src/types/index.ts`, but no algorithms or services exist to inspect OSM data, extract tags from BRouter, calculate breakdown metrics, persist breakdown in D1, or toggle colored surface segments on `MapCanvas.tsx`.

## Goals / Non-Goals

**Goals:**
- Provide a pure domain classification function `classifySurface(tags)` in `packages/core` that evaluates OSM `surface`, `tracktype`, and `highway` tags.
- Preserve fixture-backed BRouter message metadata through the routing API and parse it in `packages/core` to enrich planned walking segments without a second analysis request.
- Extend `SurfaceBreakdown` with `unknownPercentage` (strict 100% total), required categorized segments for completed results, and provenance status.
- Implement `POST /api/routes/surface-analysis` in `apps/api` with coordinate downsampling and corridor Overpass queries for GPX imports.
- Implement D1 persistence with `surface_breakdown_json` in the `routes` table, persisting precomputed data on save/update.
- Build `SurfaceBreakdownCard.tsx` with a multi-segment progress bar, kilometer/percentage stats, and an interactive map view toggle.
- Update `MapCanvas.tsx` to support `activeLayerMode?: 'stages' | 'surface'`, rendering colored segments (`#22c55e` unpaved, `#f59e0b` gravel, `#64748b` paved, `#94a3b8` unknown) when surface mode is toggled.

**Non-Goals:**
- Client-side offline vector tile extraction (analysis uses BRouter messages or the corridor API endpoint, with cached results persisted in D1).
- Editing or modifying OSM tag data directly.
- Surface classification of transit geometry or interpolated inter-track bridges.

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

### Decision 2: Fixture-Backed BRouter Metadata Contract
In `packages/core/src/surface/brouter.ts`:
- First capture a representative BRouter GeoJSON response in a test fixture and define a narrow normalized metadata type from that observed payload. Do not commit to `string[][]` until the fixture confirms it.
- Extend the routing API response to return normalized surface metadata alongside each calculated route segment. The client stores it with that segment so cache hits and concurrent segment calculations retain their analysis input.
- The parser maps each metadata span to its documented coordinate-index range, emits non-overlapping `SurfaceSegment`s, and shares boundary coordinates only. Missing or malformed spans become `unknown` segments.
- *Rationale*: This preserves the actual upstream contract through the existing API boundary and avoids a second external request without claiming an unverified payload shape.

### Decision 3: Spatial Corridor Query & Cloudflare Caching for GPX Imports
In `apps/api/src/routes/surface.ts`:
- Route: `POST /api/routes/surface-analysis`
- Input: walking stage geometry and stable stage identifiers; the API excludes transit stages and interpolated GPX stitch bridges before analysis.
- Downsample at 100m geodesic spacing while preserving every stage endpoint. Query Overpass with `around:25` samples for the retained coordinates.
- Match each original geometry edge to the nearest returned way within 25m. Resolve equal-distance candidates by smallest OSM way ID; an unmatched edge becomes an `unknown` segment. Split segments at category and stage boundaries.
- Cache results in the Worker Cache API using a Web Crypto SHA-256 digest of `surface-v1`, ordered stage IDs, and longitude/latitude rounded to five decimal places. Reversed coordinate order therefore produces a distinct cache entry.
- Failover: abort after 5 seconds and return an unavailable result containing `unknown` segments for all included walking geometry. Do not substitute a highway heuristic, because the corridor response does not reliably establish highway tags for each edge.

### Decision 4: Extended Data Model & Strict Mathematical Normalization
In `packages/core/src/types/index.ts` and `packages/core/src/surface/breakdown.ts`:
- Define `SurfaceSegment`:
  ```ts
  export interface SurfaceSegment {
    stageId: string;
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
    segments: SurfaceSegment[];
    source: 'brouter' | 'overpass' | 'unavailable';
    status: 'complete' | 'unavailable';
  }
  ```
  - Reject zero-length analysis input. For valid inputs, calculate each edge once with the shared core distance function, round individual percentages, compute the difference from 100, and assign the delta to the largest bucket to ensure `unpavedPercentage + gravelPercentage + pavedPercentage + unknownPercentage === 100` always holds.

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
  - When in `'surface'` mode, replace walking-stage line layers with colored GeoJSON segment polylines matching surface categories (`#22c55e`, `#f59e0b`, `#64748b`, `#94a3b8`); retain transit layers unchanged.
  - Waypoints, transit route segments, and stage markers remain intact and interactive.

### Decision 6: D1 Database Schema Extension & Route Save Pipeline
In `apps/api/src/db/schema.ts` and `apps/api/src/routes/routes.ts`:
- Add `surfaceBreakdownJson: text('surface_breakdown_json')` to the `routes` table schema.
- Add a Drizzle migration for the nullable column. Update `POST /api/routes` and `PUT /api/routes/:id` to persist `surfaceBreakdownJson`.
- When loading a route (`GET /api/routes/:id`), parse `surfaceBreakdownJson` and populate `surfaceBreakdown` on the client immediately without re-analyzing.
- Preserve stored analysis for metadata-only updates. Compare persisted and submitted included walking geometry plus stage identifiers; clear stale analysis before persistence when either differs, then automatically analyze valid walking geometry during the save operation.
- Return the persisted or newly calculated analysis from `POST` and geometry-changing `PUT`; a metadata-only `PUT` returns its retained analysis.

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

## Migration Plan

1. Add the nullable D1 column through a Drizzle migration; existing rows load with no analysis.
2. Deploy core types and API response support before the frontend starts sending or rendering analysis results.
3. Roll back by ignoring the nullable column and disabling the surface layer; no route geometry migration is required.
