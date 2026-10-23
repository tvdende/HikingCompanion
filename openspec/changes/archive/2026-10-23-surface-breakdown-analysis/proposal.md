## Why

Long-distance hikers and trail planners need to know what terrain they will encounter before starting a hike. A route consisting of 80% natural dirt and forest trails provides a completely different hiking experience, requires different footwear, and causes less joint fatigue than a route with 80% asphalt or paved roads. Currently, the Hiking Companion PWA has data types for `SurfaceBreakdown`, but does not analyze routes against OpenStreetMap surface data or visualize the terrain breakdown. Implementing surface analysis delivers Section 4.3 ("Ondergrond-analyse") of the product vision.

## What Changes

- **OSM Surface Tag Classifier**: Implement domain logic in `packages/core` that maps OpenStreetMap tags (`surface`, `tracktype`, `highway`) to standard categories: `unpaved` (natural, dirt, earth, grass, sand, forest paths), `gravel` (gravel, fine_gravel, compacted, tracktype grade2), `paved` (asphalt, concrete, paving_stones, tarmac), and `unknown`.
- **Dual Source Surface Data Engine**:
  - *Direct BRouter Tag Extraction*: Preserve a verified, fixture-backed BRouter metadata contract through the routing API so planned walking segments can be classified without a separate analysis request.
  - *Corridor Surface Analysis Service*: Provide a Cloudflare Worker endpoint `POST /api/routes/surface-analysis` using deterministic Overpass corridor matching, coordinate downsampling, and a canonical cache key for GPX tracks or custom walking tracks that lack routing metadata.
- **Enhanced Surface Breakdown & Segment Model**:
  - Extend `SurfaceBreakdown` with `unknownPercentage` (ensuring 100% strict mathematical summation), required categorized polylines for completed analyses, and explicit source and availability status. Transit stages remain visible but are excluded from surface totals.
- **Visual Surface Breakdown Component & Interactive Map Toggle**:
  - Add `SurfaceBreakdownCard.tsx` in `apps/web` with a segmented progress bar (green for unpaved, amber for gravel, slate for paved), kilometer totals, percentage badges, and an on-demand "Analyseer ondergrond" trigger.
  - Add an interactive visual toggle ("Toon ondergrond op kaart" / "Toon etappes") allowing users to view multi-colored trail lines on `MapCanvas.tsx` without losing stage or transit route context.
- **D1 Database Persistence**:
  - Add `surfaceBreakdownJson` column to the `routes` table in D1 so surface metrics and colored segment polylines are permanently saved and loaded instantly without external re-analysis. Preserve an analysis on metadata-only updates and invalidate it when walking geometry changes.

## Capabilities

### New Capabilities
- `surface-analysis`: Classifies OpenStreetMap surface and highway tags, computes route terrain breakdowns into unpaved, gravel, paved, and unknown segments, persists them to Cloudflare D1, and presents a visual surface breakdown summary with an interactive map coloring toggle.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `packages/core`: Add an analysis-result model and `SurfaceSegment` interface, `unknownPercentage` to `SurfaceBreakdown`, implement `classifySurface()` and `calculateSurfaceBreakdown()`, and parse a fixture-backed BRouter message contract.
  - `apps/api`: Extend the routing response to preserve BRouter surface metadata, add `POST /api/routes/surface-analysis` with deterministic corridor lookup and caching, and update D1 schema with `surfaceBreakdownJson` in `apps/api/src/db/schema.ts` and `routes.ts`.
  - `apps/web`: Add `SurfaceBreakdownCard.tsx`, integrate layer toggle into `MapCanvas.tsx`, and connect to `App.tsx` state and route saving pipeline.
  - `docs`: Update `docs/product-vision-and-techstack.md` and `docs/route-stages-and-transit.md`.
- **External Dependencies**: BRouter GeoJSON messages and OpenStreetMap Overpass API for corridor queries.
- **Performance**: Analysis reuses BRouter metadata already returned for planned routes; downsampled spatial corridor queries with caching serve GPX imports.
