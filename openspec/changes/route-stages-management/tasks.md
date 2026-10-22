## 1. Core Multi-Stage, Transit & GPX Engine

- [ ] 1.1 Extend `HikeStage` in `packages/core/src/types/index.ts` with `notes?: string; transportType?: 'foot' | 'bus' | 'train' | 'ferry';` and `RouteWaypoint` with `stageId?: string;`.
- [ ] 1.2 Implement stage utilities in `packages/core/src/route-editing/stages.ts`: `splitRouteAtWaypoint`, `mergeStages`, `reorderStages`, `deleteStageAndPoints`, `extractWaypointsPerStage`, and `calculateStageMetrics`.
- [ ] 1.3 Update `packages/core/src/gpx/parser.ts` to support multi-track GPX parsing and options to keep separate stages or merge segments.
- [ ] 1.4 Update `packages/core/src/gpx/serializer.ts` to export multi-stage routes as individual `<trk>` segments preserving stage title, notes, and transport type.
- [ ] 1.5 Write comprehensive unit tests in `tests/unit/stages.test.ts` and verify with `npm run test:unit`.

## 2. Multi-Stage Map Canvas Rendering & Badges

- [ ] 2.1 Update `MapCanvas.tsx` to render multi-stage GeoJSON LineStrings with distinct outdoor color palettes (Green, Ochre, Slate Blue, Purple, Pine).
- [ ] 2.2 Implement active stage visual emphasis (6px stroke, 1.0 opacity, interactive drag handles) and contextual inactive stage rendering (4px stroke, 0.55 opacity).
- [ ] 2.3 Implement dashed polyline rendering and vehicle badges (🚌, 🚆, ⛴️) for public transit stages (`bus`, `train`, `ferry`).
- [ ] 2.4 Add interactive transition badges on the map: `S1` (Start), `F1 / S2` (Transition), and `F_last` (Finish), with click action to merge stages.
- [ ] 2.5 Add "✂️ Splits in nieuwe etappe" button in waypoint popup markers on the map canvas.
- [ ] 2.6 Implement camera focus (`fitBounds`) for active stage and camera reset handler for full route.

## 3. Stage Manager Panel & Sidebar UI

- [ ] 3.1 Create `StageManagerPanel.tsx` component in `apps/web/src/components/` displaying ordered stage cards with distance, elevation, waypoint count, and transport type badge.
- [ ] 3.2 Implement stage title editing and optional notes textarea (e.g. overnight accommodation, transit info) in `StageManagerPanel.tsx`.
- [ ] 3.3 Implement stage reordering using both drag-and-drop handles and step buttons (▲ / ▼).
- [ ] 3.4 Add "+ Nieuwe etappe" button (spawns new stage starting at finish of previous stage) and "🔍 Toon hele route" button (resets camera to full trail bounds).
- [ ] 3.5 Implement stage deletion with confirmation modal, removing all associated waypoints and sequentially renumbering remaining stages.

## 4. GPX Import Modals & Planner State Integration

- [ ] 4.1 Create `GpxImportModal.tsx` for user selection when importing GPX:
  - Option to append to active stage vs. add as new stage (when route already exists).
  - Option to import multi-track GPX as separate stages vs. single merged stage.
- [ ] 4.2 Integrate `StageManagerPanel` and `GpxImportModal` into `apps/web/src/App.tsx`.
- [ ] 4.3 Update the undo/redo history stack in `App.tsx` to record complete snapshots of `{ waypoints, stages, activeStageId }`.
- [ ] 4.4 Update aggregate route statistics to display total distance broken down into walking distance vs. public transit distance.

## 5. Internationalization (i18n) & Documentation

- [ ] 5.1 Add Dutch (`nl.ts`) and English (`en.ts`) translation strings with 100% key parity for all stage management, public transit modes, import modals, and badges.
- [ ] 5.2 Audit touched files to ensure zero hardcoded or untranslated user-facing strings.
- [ ] 5.3 Update documentation in `/docs` (e.g. `docs/product-vision-and-techstack.md` and related docs) to reflect multi-stage capabilities and transit legs.

## 6. Automated Verification & E2E Testing

- [ ] 6.1 Run full unit test suite with `npm run test:unit` and ensure 100% passing tests.
- [ ] 6.2 Run monorepo production build with `npm run build`.
- [ ] 6.3 Create Playwright E2E test in `tests/e2e/e2e/route-stages.spec.ts` testing stage creation, splitting, reordering, public transit toggle, map camera focus, and deletion with `npm run test:e2e`.
