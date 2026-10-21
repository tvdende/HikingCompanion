## 1. Core Domain Types & Geometric Calculations

- [ ] 1.1 Define `PoiCategory`, `PointOfInterest`, and `PoiCorridorFilter` types in `packages/core/src/types` and export from `packages/core/src/index.ts`.
- [ ] 1.2 Implement along-the-route distance and perpendicular projection utilities in `packages/core/src/geo` with unit tests.
- [ ] 1.3 Implement lightweight OSM `opening_hours` parser in `packages/core/src/poi/opening-hours.ts` to detect current open/closed status and Sunday closures.

## 2. API Backend & D1 Spatial Caching

- [ ] 2.1 Add `poi_cache` table to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.
- [ ] 2.2 Implement Overpass query generator and client service in `apps/api/src/services/overpass.ts`.
- [ ] 2.3 Implement `GET /api/poi/corridor` and `GET /api/poi/bounds` endpoints in `apps/api/src/routes/poi.ts` with D1 caching, verified with unit tests.

## 3. Web UI & Map Integration

- [ ] 3.1 Add MapLibre POI GeoJSON source, custom SVG category markers, and popup interaction in `apps/web/src/components/Map.tsx`.
- [ ] 3.2 Create `PoiControlPanel.tsx` in `apps/web/src/components` with category filter chips, search input, radius slider, and sorted POI list.
- [ ] 3.3 Implement favorite POI pinning with persistent local storage so pinned amenities remain visible when filtering.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) for POI categorization, distance calculation, and API endpoints.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/poi-search.spec.ts` testing corridor scanning and category filtering.
