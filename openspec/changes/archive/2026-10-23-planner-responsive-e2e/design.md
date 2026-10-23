## Context

The planner layout is controlled by a mix of CSS and JavaScript breakpoints
that do not agree:

| Where | Breakpoint | Effect |
|---|---|---|
| `index.css` `.planner-sidebar` | ≤640px | Sidebar becomes a 50vh bottom sheet |
| `RouteEditorToolbar.tsx` | `window.innerWidth > 640` (read on render, not on resize) | Toolbar centered in the area right of the sidebar |
| `MapCanvas.tsx` `fitBounds` | `innerWidth > 768` | Left padding reserves the sidebar width |
| `index.css` library modal | ≤768px | Wider library dialog |

On desktop-like layouts, the sidebar is absolutely positioned at the top left.
It is 340–680px wide (default 390px, user-resizable and persisted in
`localStorage`) with `z-index: 45`. The toolbar has `z-index: 30`, is centered
with `translateX(-50%)`, and is capped at `95vw` with `overflow-x: auto`.

Observed consequences:
- **Tablet (820px):** the toolbar is centered in roughly 406px to the right
  of the sidebar, but its content is wider. It extends left under the
  sidebar, which has a higher `z-index`, so toolbar buttons are covered.
- **Mobile (360px):** toolbar actions are hidden behind horizontal scrolling.
  The 50vh bottom sheet, header, and toolbar leave little map area.
- **Laptop (1366×768):** low height; tall dialogs may not fit.
- **Touch:** stage step buttons (▲ ▼), toolbar buttons, and MapLibre
  navigation controls (29px) are smaller than 44px.
- The routes table has `min-width: 820px`, so it scrolls horizontally on
  small screens. This is allowed by the spec.

Testing context: Playwright projects `chromium-desktop`, `mobile-iphone`, and
`mobile-pixel` run every spec. Specs mock `/api/**` with `page.route`. Map
tiles load from `tile.openstreetmap.org`, and fonts from Google Fonts. E2E
tests are not part of CI; they run locally.

## Goals / Non-Goals

**Goals:**
- Use one consistent set of layout tiers in both CSS and JavaScript.
- Add a self-contained, deterministic responsive suite with reusable layout
  assertions and per-category screenshots.
- Fix the layout so every spec scenario passes on all four categories.

**Non-Goals:**
- Visual regression baselines (`toHaveScreenshot`).
- Landscape orientations, or devices outside the four categories.
- Redesigning planner features or changing behavior beyond what is needed for
  visibility and usability.
- Role-based access (separate change), and running E2E in CI.

## Decisions

### 1. Four Playwright projects scoped by folder
Add projects `planner-mobile`, `planner-tablet`, `planner-laptop`, and
`planner-desktop` to `playwright.config.ts`. Each has
`testMatch: 'planner-responsive/**/*.spec.ts'` and
`metadata: { category }`. Existing projects get
`testIgnore: 'planner-responsive/**'`.

| Project | Base device | Viewport | Notes |
|---|---|---|---|
| planner-mobile | `devices['Pixel 7']` (Chromium) | 360×800 | `isMobile`, `hasTouch` |
| planner-tablet | `devices['iPad (gen 7)']` (WebKit) | 820×1180 | `isMobile`, `hasTouch` |
| planner-laptop | `devices['Desktop Chrome']` | 1366×768 | |
| planner-desktop | `devices['Desktop Chrome']` | 1920×1080 | |

Playwright has no built-in iPad Air or 360×800 Android profile, so the
nearest profile is used with an explicit `viewport` override. Tablet uses
WebKit, which matches Safari on iPad.

- *Alternative:* Add the four viewports to every existing spec. This would
  roughly double total run time and mix functional and layout concerns, so
  it was rejected.

### 2. Shared fixture: planner session and in-memory API
`planner-responsive/fixtures.ts` extends `test` with:
- `/api/auth/me` returning a `planner` user;
- an in-memory store behind `/api/routes` GET, POST, PUT, and DELETE,
  seeded with two routes (draft and definitive);
- deterministic `/api/routing/route` and surface-analysis responses;
- `https://tile.openstreetmap.org/**` answered with a small neutral PNG
  fixture tile. This keeps tests offline-safe, avoids load on OSM's tile
  servers, and keeps screenshots stable. Setting `PLANNER_REAL_TILES=1`
  disables tile stubbing for screenshots that use the real map.
- a `category` value read from `testInfo.project.metadata`.

Google Fonts stays unmocked. When the network is blocked, fallback fonts
change text widths. This is acceptable because the layout must survive it.

### 3. Layout assertion helpers
`planner-responsive/layout.ts` provides:
- `expectNoHorizontalScroll(page)`: `scrollWidth <= innerWidth`.
- `expectReachable(locator)`: scroll into view inside its container, then
  assert the bounding box is inside the viewport.
- `expectNotCovered(locator)`: `document.elementFromPoint` at the element
  center must return the element or a descendant.
- `expectNoOverlap(a, b)`: bounding-box intersection is empty.
- `expectTouchTarget(locator)`: width and height must be at least 44px, and
  this only applies to `mobile` and `tablet`.
- `expectMapArea(page, 0.4)`: viewport height minus the header and planner
  panel rectangles on the map, divided by viewport height.
- `expectDialogFits(locator)`: the dialog box is inside the viewport, and
  its primary and cancel buttons are reachable.

A helper `auditVisibleControls(scope)` applies the touch target and covered
checks to every visible `button`, `select`, `input`, and `[role=button]`
inside the planner panel, toolbar, map controls, and open dialogs. It
excludes map markers and route handles.

### 4. Screenshot capture
`captureStep(page, testInfo, 'NN-name')` writes
`tests/e2e/screenshots/planner/<category>/NN-name.png` with
`fullPage: false`, because the app is a fixed-viewport shell. It also
waits for `networkidle` (3s timeout) plus a 400ms settle delay, and
disables animations. Failures are caught and reported with `testInfo.annotations`,
so they never fail the test. The folder is ignored by git.

A dedicated `planner-journey.spec.ts` walks the full flow in order and
captures these steps:

| Step | File |
|---|---|
| 01 | `01-planner-empty` |
| 02 | `02-editing-toolbar` |
| 03 | `03-route-drawn` |
| 04 | `04-waypoint-popup` |
| 05 | `05-multi-stage-panel` |
| 06 | `06-route-summary-surface` |
| 07 | `07-gpx-import-dialog` |
| 08 | `08-save-route-dialog` |
| 09 | `09-success-toast` |
| 10 | `10-route-library` |
| 11 | `11-metadata-dialog` |
| 12 | `12-delete-confirmation` |
| 13 | `13-companion-mode` |
| 14 | `14-planner-english` |

A new script, `test:e2e:planner`, deletes `tests/e2e/screenshots/planner`
and then runs only the four planner projects. This prevents stale files.
`npm run test:e2e` still runs all projects.

- *Alternative:* Screenshot inside every capability test. This produces
  too many images and an unclear order, so it was rejected in favor of one
  journey plus layout assertions in focused tests.

### 5. Capability specs
The specs are split by planner area, and each runs on all four projects:
`session-shell`, `map-controls`, `route-drawing`, `stages`,
`summary-surface`, `gpx`, `save-library`, and `feedback`. Each test performs
the real interaction and calls the layout helpers at its key states.
Touch-specific differences branch on `category`, for example using step
buttons instead of HTML5 dragging. They do not use `test.skip`. The existing
functional specs stay as they are.

### 6. Unified layout tiers
Define three tiers, used by both CSS and JavaScript:

| Tier | Width | Category |
|---|---|---|
| compact | <768px | mobile |
| medium | 768–1199px | tablet |
| wide | ≥1200px | laptop and desktop |

A small `useLayoutTier()` hook based on `matchMedia` replaces the
`window.innerWidth` reads in `RouteEditorToolbar` and `MapCanvas`, and
reacts to resize. CSS uses the same breakpoints.

### 7. Layout fixes per tier
- **compact:**
  - The bottom sheet defaults to 40vh, with a visible grab handle button that
    toggles between 40vh and 85vh.
  - The toolbar sits at the top of the map, spans the full width, and wraps
    up to two rows.
  - Toolbar buttons are icon-only, with the existing translated text as
    `aria-label` and `title`.
- **medium:**
  - The sidebar width is clamped to `min(stored width, 45vw)`, with a minimum
    of 320px.
  - The toolbar is positioned inside the map area to the right of the
    sidebar, with `max-width` equal to that area, and wraps instead of
    scrolling.
- **touch (`@media (pointer: coarse)`):**
  - Toolbar buttons, stage step, merge, and delete buttons, notes toggles,
    selects, and MapLibre control buttons get a minimum size of 44×44px.
- **all tiers:**
  - Dialogs use `max-height: calc(100dvh - 2rem)` with an internally
    scrolling body and sticky footer actions.
  - Toasts are placed so they do not overlap the toolbar.
- **wide:** keep the current look.

- *Alternative for compact toolbar:* An overflow "more" menu. This hides
  actions behind another tap and needs new menu markup, so it was rejected.

## Risks / Trade-offs

- [Cross-engine flakiness: WebKit tablet with MapLibre WebGL] → Wait for
  `networkidle` with a timeout, prefer locator-based waits with `toPass`
  retries for map markers and popups, and keep test retries local-only as today.
- [Run time grows by about 4× the new spec count] → Keep capability tests
  focused. The journey is the only long test, and `test:e2e:planner` allows
  targeted runs.
- [Strict 44px touch targets require many CSS changes] → Scope them to
  `pointer: coarse`, so laptop and desktop visuals are unchanged.
- [`elementFromPoint` checks can be affected by animations] → Disable
  animations in the fixture with `reducedMotion: 'reduce'` and an injected
  stylesheet, and check after transitions complete.
- [The stored sidebar width from desktop is reused on a tablet] → The medium
  tier clamps it at render time without overwriting the stored value.
- [Stubbed tiles make screenshots less realistic] → `PLANNER_REAL_TILES=1`
  opt-in.
- [Layout fixes may break existing functional specs (selectors, map click
  coordinates)] → Run the full `npm run test:e2e` as part of the final
  validation and update helper coordinates if needed.
