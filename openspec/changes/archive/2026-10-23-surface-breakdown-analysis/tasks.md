## 1. Core Domain Types & Classification Algorithms (`packages/core`)

- [x] 1.1 Update `packages/core/src/types/index.ts` with analysis source/status, stage-scoped `SurfaceSegment`, required completed-analysis segments, and strict-normalization fields; verify typecheck succeeds.
- [x] 1.2 Implement `classifySurface(tags: Record<string, string>): SurfaceCategory` in `packages/core/src/surface/classifier.ts` evaluating OSM `surface`, `tracktype`, and `highway` tags with comprehensive hierarchy matching European hiking standards.
- [x] 1.3 Capture a representative BRouter GeoJSON response in a unit-test fixture, define its normalized metadata contract, and verify parsing maps every documented coordinate span without overlaps or gaps.
- [x] 1.4 Implement `parseBRouterMessages` in `packages/core/src/surface/brouter.ts` against the fixture-backed contract, converting malformed or uncovered spans to `unknown`; verify parser tests pass.
- [x] 1.5 Implement `calculateSurfaceBreakdown(segments)` using the shared distance authority, rejecting zero-length input and strictly normalizing percentages; verify distance and $100\%$ normalization tests pass.
- [x] 1.6 Export all surface modules from `packages/core/src/index.ts`, and create unit tests in `tests/unit/surface-classifier.test.ts` and `tests/unit/surface-breakdown.test.ts` for classification precedence, zero-length rejection, and unknown coverage.

## 2. API Corridor Service & D1 Persistence (`apps/api`)

- [x] 2.1 Extend the routing endpoint to preserve normalized BRouter surface metadata per calculated segment; verify routing fixture tests expose the metadata through the API response.
- [x] 2.2 Implement `POST /api/routes/surface-analysis` in `apps/api/src/routes/surface.ts` with 100m endpoint-preserving downsampling, `around:25` Overpass lookup, deterministic nearest-way matching, canonical SHA-256 cache keys, and a 5-second unavailable result; verify mocked endpoint tests pass.
- [x] 2.3 Add the nullable `surface_breakdown_json` Drizzle schema field and migration; verify a test D1 database applies the migration.
- [x] 2.4 Update `apps/api/src/routes/routes.ts` (`POST`, `PUT`, and `GET /:id`) to persist and return analysis, retain it for metadata-only updates, and invalidate/recalculate it for walking-geometry or stage changes; verify route API tests cover each case.
- [x] 2.5 Add unit tests for malformed/empty coordinates, cache hits, Overpass tie-breaking, timeout-unavailable results, transit exclusion, and persistence behavior in `tests/unit/surface-api.test.ts`.

## 3. Frontend UI, i18n & MapCanvas Layer Toggle (`apps/web`)

- [x] 3.1 Add Dutch and English translation keys for surface breakdown, categories, buttons, and layer toggle with 100% key parity in `apps/web/src/i18n/locales/nl.ts` and `apps/web/src/i18n/locales/en.ts`.
- [x] 3.2 Implement `SurfaceBreakdownCard.tsx` in `apps/web/src/components` with segmented color progress bar, kilometer/percentage stats, on-demand analysis button, and "Toon ondergrond op kaart" / "Toon etappes" toggle button.
- [x] 3.3 Update `apps/web/src/components/MapCanvas.tsx` to support `activeLayerMode?: 'stages' | 'surface'`, rendering colored segments (`#22c55e` unpaved, `#f59e0b` gravel, `#64748b` paved, `#94a3b8` unknown) when in `'surface'` mode while maintaining waypoints and transit lines.
- [x] 3.4 Wire surface breakdown into `App.tsx`: retain BRouter metadata for planned walking segments, trigger corridor analysis for GPX imports or on-demand requests, clear stale analysis on walking geometry mutations, and include result state in route save/load operations; verify focused component tests pass.

## 4. Documentation, Build & Verification

- [x] 4.1 Update documentation in `docs/product-vision-and-techstack.md` and `docs/route-stages-and-transit.md` detailing the surface analysis engine and map layer toggle.
- [x] 4.2 Run unit test suite with `npm run test:unit` and verify all tests pass.
- [x] 4.3 Verify clean monorepo build with `npm run build`.
- [x] 4.4 Add Playwright E2E test in `tests/e2e/e2e/surface-breakdown.spec.ts` verifying surface card rendering, unavailable state, and map-toggle layer visibility while transit lines and markers remain present; run `npm run test:e2e`.
