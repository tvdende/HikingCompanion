## 1. Core Domain Classification & Breakdown Algorithms

- [ ] 1.1 Implement `classifySurface(tags)` in `packages/core/src/surface/classifier.ts` mapping OSM `surface`, `tracktype`, and `highway` tags to `SurfaceCategory` (`unpaved`, `gravel`, `paved`, `unknown`), verified with unit tests in `tests/unit/surface-classifier.test.ts`.
- [ ] 1.2 Implement `calculateSurfaceBreakdown(segments)` in `packages/core/src/surface/breakdown.ts` calculating cumulative distances and percentage distributions summing strictly to 100%, verified with unit tests in `tests/unit/surface-breakdown.test.ts`.
- [ ] 1.3 Export surface functions and types via `packages/core/src/index.ts` and verify package build.

## 2. API Corridor Service & D1 Persistence

- [ ] 2.1 Implement `POST /api/routes/surface-analysis` in `apps/api/src/routes/surface.ts` with coordinate downsampling, Overpass corridor querying, and 5-second timeout fallback, verified with unit tests in `tests/unit/surface-api.test.ts`.
- [ ] 2.2 Extend D1 `routes` schema with `surfaceBreakdown` JSON column so analysis results are permanently saved with the route, and persist analysis results when saving or updating routes.

## 3. Frontend UI Component & Map Layer Integration

- [ ] 3.1 Create `SurfaceBreakdownCard.tsx` in `apps/web/src/components` rendering an on-demand "Analyseer ondergrond" button, multi-segment color bar (green for unpaved, amber for gravel, slate for paved), kilometer distances, and percentage badges.
- [ ] 3.2 Add colored segment line rendering to MapLibre in `apps/web/src/components/Map.tsx` reflecting surface types along the trail track.
- [ ] 3.3 Integrate `SurfaceBreakdownCard` into `App.tsx` and the route details panel, loading precomputed surface data instantly from saved routes or executing on-demand analysis.

## 4. Verification & Testing

- [ ] 4.1 Run full unit test suite with `npm run test:unit` to verify tag classification, percentage normalization, and API handler response.
- [ ] 4.2 Verify monorepo build passes without type or bundling errors using `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/surface-breakdown.spec.ts` asserting that loading a route renders the surface breakdown card and stats, and verify with `npm run test:e2e`.
