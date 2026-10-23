## Why

The planner is the main workspace of Hiking Companion, but its layout only
adapts at a single 640px breakpoint and is not verified across common screen
sizes. Inspection shows likely problems on tablets: the left sidebar has a
fixed minimum width while the editor toolbar floats centered at the top, so
they can overlap. On phones, toolbar buttons are hidden behind horizontal
scrolling. Existing E2E tests check that features work, but not that every
planner control is visible and usable on each device class. We need a
repeatable way to prove the planner works well on the screens people
actually use, and we need to fix what fails.

## What Changes

- Define four supported device categories for the planner, each with a
  fixed, commonly used viewport:
  - **mobile**: Android phone, 360×800, touch
  - **tablet**: iPad Air portrait, 820×1180, touch
  - **laptop**: 1366×768
  - **desktop**: 1920×1080
- Add a dedicated Playwright suite that runs only on these four categories.
  It covers every planner capability: session and shell, map controls, route
  drawing and editing, stages, route summary and surface analysis, GPX
  import/export, saving and the route library, and in-app feedback.
- Each test asserts measurable visibility and usability rules: key controls
  are within the viewport or reachable by scrolling, nothing important is
  covered by another element, there is no unintended horizontal page scroll,
  touch targets are large enough on touch devices, dialogs fit the screen,
  and the map keeps a usable drawing area.
- Capture documentation screenshots at defined steps of the planner flow,
  stored per device category in separate folders. Screenshots are evidence
  for manual review and never fail a test.
- Fix the responsive layout issues the suite finds (CSS and minimal markup
  changes), so all tests pass on all four categories.
- Keep the existing E2E projects and specs unchanged in scope; the new
  categories do not multiply the existing suite.

Out of scope: role-based restrictions for the `user` role (separate change),
visual regression comparison against baseline images, and running E2E in CI.

## Capabilities

### New Capabilities

- `planner-responsive-layout`: The planner's visibility and usability
  guarantees on the four supported device categories, and the responsive
  verification suite with per-category screenshots.

### Modified Capabilities

_None._ The `pwa-shell` responsive-layout requirement remains valid; this
change makes it concrete for the planner in a new capability instead of
rewriting the general shell requirement.

## Impact

- `tests/e2e/playwright.config.ts`: four new projects scoped to the new suite;
  existing projects ignore it.
- `tests/e2e/e2e/planner-responsive/`: new specs, shared fixtures (mocked
  planner session and APIs), and layout/screenshot helpers.
- `apps/web/src/index.css` (and, if needed, small markup changes in
  `App.tsx`, `RouteEditorToolbar.tsx`, `StageManagerPanel.tsx`, and
  `MapCanvas.tsx`): responsive fixes for tablet, phone, and low-height
  laptop screens.
- `.gitignore`: ignore the generated screenshot output folder.
- `docs/`: testing strategy and supported device categories.
- No API, database, or `packages/core` changes.
