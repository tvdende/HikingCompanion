## Context

See `proposal.md` for motivation. Currently, `apps/web/src/App.tsx` mounts `<MapCanvas />` and the GPX planning sidebar unconditionally, regardless of whether a user is logged in. `AuthContext` already tracks `user: UserProfile | null` and `isLoading: boolean`. When unauthenticated, visitors should see an informative product showcase and interactive demo rather than a raw, empty map canvas. All showcase copy and demo highlights must be easy to update directly in source code.

## Goals / Non-Goals

**Goals:**
- Gate the interactive map canvas and route editing panels behind active user authentication (`user !== null`).
- Create a dedicated `<LandingPage />` component displayed to guests with hero messaging, interactive feature demos (GPX import/elevation stats, dual Planner/Companion modes, offline vector tiles), and clear sign-in instructions.
- Decouple all landing page text, feature items, demo scenarios, and onboarding steps into a strongly-typed source file (`apps/web/src/content/showcase.ts`) for effortless editing in source control.
- Ensure the landing page is fully responsive, dark-mode compliant, and accessible on both desktop and mobile viewports.
- Connect landing page call-to-action buttons to the existing `LoginModal` trigger.

**Non-Goals:**
- External CMS or database storage for landing content (static source configuration is zero-latency, offline-compatible, and version-controlled with git).
- Altering the authenticated planner or companion workflows.

## Decisions

### Decision 1: Dedicated Source Content Module (`apps/web/src/content/showcase.ts`)
- **Choice**: Store all showcase copy, value proposition cards, demo metadata, and login instructions in a typed TypeScript configuration module (`showcase.ts`).
- **Rationale**: Eliminates hardcoded strings in layout components, enforces type safety on content schema, supports hot module reloading during local editing, and makes it trivial for anyone to tweak marketing text or instructions in git.
- **Alternatives Considered**: 
  - *Hardcoding in TSX*: Makes editing difficult and clutters UI code.
  - *Markdown or JSON files*: Requires extra loaders or runtime parsing; TypeScript provides better autocomplete, type validation, and bundle optimization.

### Decision 2: Interactive Feature Preview Component
- **Choice**: Include an interactive preview component on the landing page where visitors can toggle between tabs to preview:
  1. GPX route import & elevation graph visualization.
  2. Planner Mode (stage-by-stage hiking plan) vs. Companion HUD (high-contrast metrics).
  3. Offline vector maps & zero-reception readiness.
- **Rationale**: Gives visitors immediate, tangible insight into what the app does without needing to upload an actual GPX file or log in first.
- **Alternatives Considered**: Static text-only bullets (less engaging, misses the visual nature of a hiking navigation tool).

### Decision 3: View Routing in Application Shell (`App.tsx`)
- **Choice**: In `App.tsx`, evaluate `user` from `useAuth()`:
  - While `isLoading`: render subtle loading placeholder.
  - If `user`: render the interactive workspace (`<MapCanvas />` + sidebar).
  - If `!user`: render `<LandingPage onOpenLogin={() => setIsLoginModalOpen(true)} />`.
- **Rationale**: Clean single-page architecture with immediate state reaction upon login or logout.

## Risks / Trade-offs

- **[Existing E2E tests assume guest sees MapCanvas]** → Update `tests/e2e` so that guest test suites verify the new LandingPage, feature cards, and login modal, while map-specific tests execute `loginWithMock` first.
- **[Bundle size with demo assets]** → Keep preview visualizations lightweight using SVG/CSS and mock data arrays rather than heavy raster assets or full MapLibre instances on the landing page.
