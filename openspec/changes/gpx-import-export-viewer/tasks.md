## 1. Core GPX Engine & Parsers

- [ ] 1.1 Implement GPX XML parser in `packages/core/src/gpx/parser.ts` to parse GPX 1.0/1.1 strings into `HikeRoute` domain objects, and verify with unit tests in `tests/unit/gpx.test.ts`.
- [ ] 1.2 Implement trail metrics calculator in `packages/core/src/gpx/metrics.ts` computing cumulative distance, elevation gain (+m), and elevation loss (-m), verifying calculations with unit tests.
- [ ] 1.3 Implement GPX XML serializer in `packages/core/src/gpx/serializer.ts` converting `HikeRoute` instances to valid GPX 1.1 XML strings, verifying with unit tests.
- [ ] 1.4 Export GPX functions from `packages/core` entrypoint and verify clean compilation with `npm run build -w packages/core`.

## 2. Map Track Visualization

- [ ] 2.1 Update `MapCanvas.tsx` in `apps/web` to receive an active `HikeRoute` and render the track polyline via MapLibre GL GeoJSON source and layers.
- [ ] 2.2 Add distinctive start (green) and end (red) waypoint markers on the map canvas at the first and last track coordinates.
- [ ] 2.3 Implement automatic camera bounds fitting (`fitBounds`) with padding so the entire trail fits into view upon loading.

## 3. UI File Upload & Route Statistics

- [ ] 3.1 Add file upload and drag-and-drop triggers in `App.tsx` reading `.gpx` files and parsing them into state.
- [ ] 3.2 Render trail statistics cards (distance, elevation gain, elevation loss, point count) in the Planner Mode sidebar and Companion HUD.
- [ ] 3.3 Add an export button allowing users to download the current route as a `.gpx` file to their device.

## 4. End-to-End Testing & Verification

- [ ] 4.1 Create a test GPX trail fixture in `tests/e2e/fixtures/sample-trail.gpx`.
- [ ] 4.2 Add Playwright E2E test in `tests/e2e/e2e/gpx-flow.spec.ts` verifying GPX upload, track line rendering on map, and metrics presentation.
- [ ] 4.3 Verify that `npm run test:unit` and `npm run test:e2e` pass without regressions.
