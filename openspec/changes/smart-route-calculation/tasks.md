## 1. Core Utilities & Segment Caching

- [ ] 1.1 Create `segmentCache` utility with LRU bounded storage, bidirectional key generation (`generateSegmentKey`), and coordinate normalization (`toFixed(6)`), verified by unit tests in `tests/unit/segment-cache.test.ts`.
- [ ] 1.2 Implement segment diffing helper `diffRouteSegments(currentSegments, targetWaypointPairs)` that identifies intact segments to retain vs dirty segments to calculate, verified by unit tests in `tests/unit/route-editing.test.ts`.

## 2. Route Planner Differential Engine & Concurrency

- [ ] 2.1 Refactor `updateRoute()` in `apps/web/src/App.tsx` to use differential segment diffing, preserving unchanged segments directly from state without network calls.
- [ ] 2.2 Implement concurrent segment fetching using `Promise.all()` and `AbortController` signal cancellation to prevent race conditions during rapid editing.
- [ ] 2.3 Integrate cache lookup and population into `updateRoute()` so that reversed routes, undo actions, and repeat paths resolve instantly without network round-trips.
- [ ] 2.4 Add optimistic visual connector line for newly added waypoints and isolate external routing errors with segment-level graceful fallback.

## 3. Responsive Waypoint Drag-Preview

- [ ] 3.1 Implement transient straight-line rubber-band preview in `apps/web/src/components/MapViewer.tsx` during waypoint drag interactions (`onDragStart` / `onDrag`).
- [ ] 3.2 Commit final coordinates and trigger differential trail-snapped calculation only on drop (`onDragEnd`).

## 4. Documentation & Verification

- [ ] 4.1 Update documentation in `docs/product-vision-and-techstack.md` and `docs/route-stages-and-transit.md` describing differential calculation, caching, optimistic preview, and drag performance.
- [ ] 4.2 Verify all unit tests pass (`npm run test:unit`) and monorepo builds cleanly (`npm run build`).
- [ ] 4.3 Add automated E2E tests in `tests/e2e/e2e/route-planner.spec.ts` validating differential updates and segment cache hits (`npm run test:e2e`).
