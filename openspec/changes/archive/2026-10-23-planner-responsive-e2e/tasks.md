## 1. Test infrastructure

- [x] 1.1 Add the `planner-mobile` (Pixel 7, 360×800), `planner-tablet` (iPad gen 7, 820×1180), `planner-laptop` (1366×768), and `planner-desktop` (1920×1080) projects to `tests/e2e/playwright.config.ts`, each with `testMatch: 'planner-responsive/**/*.spec.ts'` and `metadata.category`. Add `testIgnore: 'planner-responsive/**'` to the existing projects. Verify with `npx playwright test --list` that each suite appears only under its own projects
- [x] 1.2 Create `tests/e2e/e2e/planner-responsive/fixtures.ts` with a planner-role `/api/auth/me`, in-memory `/api/routes` CRUD seeded with one draft and one definitive route, deterministic routing and surface responses, stubbed OSM tiles with a `PLANNER_REAL_TILES=1` opt-out, reduced motion, and a `category` fixture. Verify with a smoke spec that opens the planner on all four projects
- [x] 1.3 Create `planner-responsive/layout.ts` with `expectNoHorizontalScroll`, `expectReachable`, `expectNotCovered`, `expectNoOverlap`, `expectTouchTarget` (applied only for touch categories), `expectMapArea`, `expectDialogFits`, and `auditVisibleControls`. Verify that the helpers fail on a deliberately broken assertion and pass on the planner start screen
- [x] 1.4 Create `planner-responsive/screenshots.ts` with `captureStep`, writing to `tests/e2e/screenshots/planner/<category>/NN-name.png`. Make it wait for `networkidle` plus a short settle delay, never fail the test, and add an annotation when capture fails. Add `tests/e2e/screenshots/` to `.gitignore`. Verify that a smoke run creates four category folders and that git ignores them
- [x] 1.5 Add a `test:e2e:planner` script in `tests/e2e/package.json` and the root `package.json` that removes `tests/e2e/screenshots/planner` and runs only the four planner projects. Verify that running it recreates the screenshot folders

## 2. Capability specs (all four categories)

- [x] 2.1 `session-shell.spec.ts`: header, profile menu, logout, Planner/Companion switch, and NL/EN switch, with layout checks. Verify with `npm run test:e2e:planner`
- [x] 2.2 `map-controls.spec.ts`: zoom and compass controls, locate button, and center on route are reachable, uncovered, and touch-sized. Verify with `npm run test:e2e:planner`
- [x] 2.3 `route-drawing.spec.ts`: new route, toolbar with every action reachable, add, drag, and insert waypoints, waypoint popup split and delete, snap/direct mode, undo/redo, reverse, clear, and map area of at least 40%. Verify with `npm run test:e2e:planner`
- [x] 2.4 `stages.spec.ts`: add stage, select, rename, notes, transport type, move up and down, drag only on non-touch categories, merge via the panel and the map popup, delete with confirmation, and view full route. Verify with `npm run test:e2e:planner`
- [x] 2.5 `summary-surface.spec.ts`: route summary statistics, status badge, clear route, surface analysis, and map layer toggle. Verify with `npm run test:e2e:planner`
- [x] 2.6 `gpx.spec.ts`: import via button and file input, append to the active route, every import dialog variant, error banner, and export. Verify that the dialog fits and with `npm run test:e2e:planner`
- [x] 2.7 `save-library.spec.ts`: save dialog fields, library search and filters, load, export, edit metadata, and delete, with the table scrolling inside its container on mobile and tablet. Verify with `npm run test:e2e:planner`
- [x] 2.8 `feedback.spec.ts`: success and error toasts do not overlap the toolbar, and the confirmation dialog fits and restores focus. Verify with `npm run test:e2e:planner`
- [x] 2.9 `planner-journey.spec.ts`: walk the full flow and capture steps 01–14 as listed in design.md. Verify that each category folder contains all 14 files

## 3. Layout fixes

- [x] 3.1 Add a `useLayoutTier()` hook (compact <768, medium 768–1199, wide ≥1200) based on `matchMedia`. Replace the `window.innerWidth` checks in `RouteEditorToolbar.tsx` and `MapCanvas.tsx`, and align the CSS breakpoints. Verify that the build passes and that resizing updates the toolbar position
- [x] 3.2 Compact tier: make the bottom sheet default to 40vh, with a translated grab handle that toggles to 85vh. Make the toolbar full-width and wrapping, with icon-only buttons that keep their translated `aria-label` and `title`. Verify that the mobile route-drawing and map-area checks pass
- [x] 3.3 Medium tier: clamp the sidebar width to `min(stored, 45vw)` with a minimum of 320px, without overwriting the stored value. Constrain the toolbar to the map area to the right of the sidebar and make it wrap. Verify that the tablet overlap and covered checks pass
- [x] 3.4 Touch targets: under `@media (pointer: coarse)`, give toolbar, stage, notes, select, dialog, and MapLibre control buttons a minimum size of 44×44px. Verify that the mobile and tablet `auditVisibleControls` checks pass
- [x] 3.5 Dialogs and toasts: use `max-height: calc(100dvh - 2rem)`, an internally scrolling body, and sticky actions for the save, metadata, GPX import, confirmation, and library dialogs. Position toasts so they do not overlap the toolbar. Verify that `expectDialogFits` and the feedback checks pass on laptop and mobile
- [x] 3.6 Fix any remaining failures found by the suite, and translate every new user-facing text (including the grab handle label) in `nl.ts` and `en.ts` with full key parity. Verify with `npm run test:e2e:planner` on all four categories

## 4. Regression, documentation, and validation

- [x] 4.1 Run the existing E2E projects and fix any regressions caused by the layout changes, such as map click coordinates or selectors. Verify with `npm run test:e2e`
- [x] 4.2 Document the four device categories, layout tiers, layout assertions, screenshot folders, `test:e2e:planner`, and `PLANNER_REAL_TILES` in a new `docs/responsive-planner-testing.md`, and link it from the testing section of `docs/product-vision-and-techstack.md`. Verify that the docs match the implementation
- [x] 4.3 Run `npm run test:unit`, `npm run build`, `npm run test:e2e`, and `npm run test:e2e:planner`, verify that all pass, review the 4 × 14 screenshots manually, and check that there is no hardcoded user-facing text in touched components
