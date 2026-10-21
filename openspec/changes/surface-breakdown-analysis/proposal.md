## Why

Long-distance hikers and trail planners need to know what terrain they will encounter before starting a hike. A route consisting of 80% natural dirt and forest trails provides a completely different hiking experience, requires different footwear, and causes less joint fatigue than a route with 80% asphalt or paved roads. Currently, the Hiking Companion PWA has data types for `SurfaceBreakdown`, but does not analyze routes against OpenStreetMap surface data or visualize the terrain breakdown. Implementing surface analysis delivers Section 4.3 ("Ondergrond-analyse") of the product vision.

## What Changes

- **OSM Surface Tag Classifier**: Implement domain logic in `packages/core` that maps OpenStreetMap tags (`surface`, `tracktype`, `highway`) to standard categories: `unpaved` (natural, dirt, earth, grass, sand, forest paths), `gravel` (gravel, fine_gravel, compacted, tracktype grade2), `paved` (asphalt, concrete, paving_stones, tarmac), and `unknown`.
- **Corridor Surface Analysis Service**: Add a Cloudflare Worker service endpoint `POST /api/routes/surface-analysis` that accepts route coordinates, retrieves way surface attributes from OSM/Overpass (with spatial caching), and segments the route into categorized intervals.
- **Surface Breakdown Computation**: Calculate exact distance in meters/kilometers and percentage share for each surface category across the entire hike route.
- **Visual Surface Breakdown Component**: Add a `SurfaceBreakdownCard.tsx` component in `apps/web` featuring a segmented progress bar (green for unpaved, amber for gravel, slate for paved) and a metric list displaying kilometers and percentages.
- **Integration with Planner & Active Route**: Automatically trigger surface analysis when a route is imported via GPX or designed in the planner, updating the sidebar stats in real time.

## Capabilities

### New Capabilities
- `surface-analysis`: Classifies OpenStreetMap surface and highway tags, computes route terrain breakdowns into unpaved, gravel, and paved segments, and presents a visual surface breakdown summary.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `packages/core`: Implement `classifySurface()`, `calculateSurfaceBreakdown()`, and geometry matching utilities.
  - `apps/api`: Add `POST /api/routes/surface-analysis` endpoint with OSM corridor lookup and in-memory/D1 caching.
  - `apps/web`: Add `SurfaceBreakdownCard.tsx`, integrate into `App.tsx` and the planner sidebar, and add surface breakdown display styles.
- **External Dependencies**: Uses OpenStreetMap Overpass API or routing service tag annotations for corridor queries.
- **Performance**: Analysis is executed asynchronously with debouncing and spatial bounding box queries to avoid UI freezing on long GPX tracks.
