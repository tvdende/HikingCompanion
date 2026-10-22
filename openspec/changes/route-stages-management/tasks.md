## 1. Core Multi-Stage Data & Splitting Engine

- [ ] 1.1 Implement multi-stage utilities (`splitRouteAtWaypoint`, `mergeStages`, `reorderStages`, and `calculateStageMetrics`) in `packages/core/src/route-editing/stages.ts`.
- [ ] 1.2 Export stage utilities in `packages/core/src/index.ts` and verify unit tests in `tests/unit/stages.test.ts` pass with `npm run test:unit`.
- [ ] 1.3 Add Dutch and English i18n translation strings for stage management terms (`stages`, `splitStage`, `activeStage`, `addStage`, `mergeStage`) in `apps/web/src/i18n/locales/nl.ts` and `en.ts`.

## 2. Multi-Stage Map Canvas Rendering & Camera Focus

- [ ] 2.1 Update `MapCanvas.tsx` to render multi-stage GeoJSON LineString features with a distinct color palette per stage.
- [ ] 2.2 Implement active stage visual highlight (full opacity, thicker stroke) and contextual rendering of inactive stages (subdued opacity).
- [ ] 2.3 Add stage boundary badges on start/transition/finish markers on the map canvas.
- [ ] 2.4 Implement smooth camera animation (`fitBounds`/`flyTo`) focusing the map on the active stage's bounding box when selected.
- [ ] 2.5 Add "✂️ Splits in nieuwe etappe" button in waypoint popup in `MapCanvas.tsx`.

## 3. Stage Manager Panel & Route Planner Integration

- [ ] 3.1 Create `StageManagerPanel.tsx` component displaying the ordered list of stages, per-stage distance (km), elevation gain (+m), waypoint count, and active stage indicator.
- [ ] 3.2 Integrate `StageManagerPanel` into the planner sidebar in `App.tsx` and connect stage selection, renaming, and addition callbacks.
- [ ] 3.3 Scope interactive waypoint dragging, point insertion, and tail additions to the active stage while keeping the full route visible.
- [ ] 3.4 Update the undo/redo history stack in `App.tsx` to track both stage boundaries and waypoint geometry.

## 4. Automated Verification & E2E Testing

- [ ] 4.1 Verify all unit tests pass with `npm run test:unit`.
- [ ] 4.2 Verify monorepo production build succeeds with `npm run build`.
- [ ] 4.3 Create Playwright E2E test in `tests/e2e/e2e/route-stages.spec.ts` asserting that user can split a route into multiple stages, select stages in the sidebar list, verify camera focus, and edit the active stage while remaining stages remain visible.
