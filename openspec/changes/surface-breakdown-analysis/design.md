## Context

See `proposal.md` for motivation and `specs/surface-analysis/spec.md` for functional requirements. The domain interfaces `SurfaceCategory` and `SurfaceBreakdown` are defined in `packages/core/src/types/index.ts`, but no algorithms or services exist to inspect OSM data and calculate the breakdown.

## Goals / Non-Goals

**Goals:**
- Provide a pure domain classification function `classifySurface()` in `packages/core` that evaluates OSM `surface`, `tracktype`, and `highway` tags.
- Implement `calculateSurfaceBreakdown()` in `packages/core` that aggregates geodesic segment lengths and computes percentage distributions totaling 100%.
- Implement `POST /api/routes/surface-analysis` in `apps/api` with corridor spatial queries and caching.
- Build `SurfaceBreakdownCard.tsx` in `apps/web` with a multi-segment color bar and statistics grid.
- Integrate surface breakdown into the Planner view when any GPX file is loaded or route is planned.

**Non-Goals:**
- Offline vector tile inspection (client-side terrain analysis runs via API when connected, with cached results persisted alongside routes).
- Editing or modifying OSM tag data.

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

### Decision 2: Spatial Corridor Query & Cloudflare Caching
In `apps/api/src/routes/surface.ts`:
- Route: `POST /api/routes/surface-analysis`
- Input: `{ coordinates: Coordinate[] }`
- Performance optimization: Downsample coordinates for corridor query (spacing ~75m–100m) to reduce Overpass payload size while maintaining high accuracy.
- Query OSM Overpass API or local way bounding box with a 25m corridor buffer.
- Cache results: Cache calculated surface breakdown in Cloudflare Worker Cache API keyed by route MD5 hash.
- Failover: 5-second timeout. If external API is unreachable, fall back to highway-type heuristic and flag as estimated.

### Decision 3: Precision Math & Rounding
In `packages/core/src/surface/breakdown.ts`:
- Accumulate distance in meters using geodesic distance between consecutive coordinates.
- Calculate percentages:
  ```ts
  const unpavedPct = Math.round((unpavedMeters / totalMeters) * 100);
  const gravelPct = Math.round((gravelMeters / totalMeters) * 100);
  const pavedPct = Math.round((pavedMeters / totalMeters) * 100);
  ```
- Ensure largest bucket absorbs any rounding difference so sum is strictly 100%.

### Decision 4: Visual Breakdown Component
In `apps/web/src/components/SurfaceBreakdownCard.tsx`:
- Segmented bar:
  - Green (`#22c55e`): Onverhard / Bospad / Zandpad
  - Amber (`#f59e0b`): Grind / Halfverhard
  - Slate (`#64748b`): Asfalt / Verhard
  - Muted (`#475569`): Onbekend
- Tooltips showing exact kilometer and percentage breakdown.
- Displayed prominently in the Planner sidebar under trail statistics.

## Risks / Trade-offs

- **[Risk] Overpass API latency or rate limits**
  → *Mitigation*: Coordinate downsampling, 5s timeout fallback, and Cloudflare Worker caching ensure the user experience is never blocked.
- **[Risk] Long routes (>100 km) taking too long to analyze**
  → *Mitigation*: Run analysis asynchronously in the background. The UI displays existing route metrics immediately and populates the surface card once analysis completes.
