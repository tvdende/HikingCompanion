## 1. Core Domain Types & Classification Algorithms (`packages/core`)

- [ ] 1.1 Update `packages/core/src/types/index.ts` with `SurfaceSegment` interface, add `unknownPercentage` and `segments?: SurfaceSegment[]` to `SurfaceBreakdown`, and export new types.
- [ ] 1.2 Implement `classifySurface(tags: Record<string, string>): SurfaceCategory` in `packages/core/src/surface/classifier.ts` evaluating OSM `surface`, `tracktype`, and `highway` tags with comprehensive hierarchy matching European hiking standards.
- [ ] 1.3 Implement `parseBRouterMessages(messages: string[][], coordinates: Coordinate[]): SurfaceSegment[]` in `packages/core/src/surface/brouter.ts` extracting way tags along route coordinates with 0ms calculation latency.
- [ ] 1.4 Implement `calculateSurfaceBreakdown(segments: SurfaceSegment[]): SurfaceBreakdown` in `packages/core/src/surface/breakdown.ts` calculating cumulative meter distances and percentage distributions strictly normalized to 100%.
- [ ] 1.5 Export all surface modules from `packages/core/src/index.ts`, and create unit tests in `tests/unit/surface-classifier.test.ts` and `tests/unit/surface-breakdown.test.ts`.

## 2. API Corridor Service & D1 Persistence (`apps/api`)

- [ ] 2.1 Implement `POST /api/routes/surface-analysis` in `apps/api/src/routes/surface.ts` with coordinate downsampling (~75m–100m), Overpass API corridor querying with 25m buffer, Cloudflare Worker cache integration, and 5-second fallback timeout.
- [ ] 2.2 Extend D1 `routes` schema with `surfaceBreakdownJson: text('surface_breakdown_json')` in `apps/api/src/db/schema.ts`.
- [ ] 2.3 Update `apps/api/src/routes/routes.ts` (`POST /api/routes`, `PUT /api/routes/:id`, `GET /api/routes/:id`) to accept, store, and return `surfaceBreakdownJson` and parse it into `surfaceBreakdown`.
- [ ] 2.4 Add unit tests for the surface analysis endpoint and persistence in `tests/unit/surface-api.test.ts`.

## 3. Frontend UI, i18n & MapCanvas Layer Toggle (`apps/web`)

- [ ] 3.1 Add Dutch and English translation keys for surface breakdown, categories, buttons, and layer toggle with 100% key parity in `apps/web/src/i18n/locales/nl.ts` and `apps/web/src/i18n/locales/en.ts`.
- [ ] 3.2 Implement `SurfaceBreakdownCard.tsx` in `apps/web/src/components` with segmented color progress bar, kilometer/percentage stats, on-demand analysis button, and "Toon ondergrond op kaart" / "Toon etappes" toggle button.
- [ ] 3.3 Update `apps/web/src/components/MapCanvas.tsx` to support `activeLayerMode?: 'stages' | 'surface'`, rendering colored segments (`#22c55e` unpaved, `#f59e0b` gravel, `#64748b` paved, `#94a3b8` unknown) when in `'surface'` mode while maintaining waypoints and transit lines.
- [ ] 3.4 Wire surface breakdown into `App.tsx`: extract tags directly from BRouter response during route calculation, trigger API corridor analysis on GPX import or on-demand click, pass active layer mode to `MapCanvas.tsx`, and include surface data in route save/load operations.

## 4. Documentation, Build & Verification

- [ ] 4.1 Update documentation in `docs/product-vision-and-techstack.md` and `docs/route-stages-and-transit.md` detailing the surface analysis engine and map layer toggle.
- [ ] 4.2 Run unit test suite with `npm run test:unit` and verify all tests pass.
- [ ] 4.3 Verify clean monorepo build with `npm run build`.
- [ ] 4.4 Add Playwright E2E test in `tests/e2e/e2e/surface-breakdown.spec.ts` verifying surface card rendering and map toggle interaction, and run `npm run test:e2e`.
