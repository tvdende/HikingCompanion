## Context

The project is greenfield with comprehensive high-level specifications defined in `docs/product-vision-and-techstack.md`. See `proposal.md` for motivation and scope. This design defines the technical architecture for the project scaffolding, the two independent test projects, the PWA application shell, and the MapLibre GL map integration.

## Goals / Non-Goals

**Goals:**
- Establish an npm monorepo with `apps/web`, `apps/api`, and `packages/core`.
- Configure `tests/unit` with Vitest for fast, isolated unit and domain logic testing.
- Configure `tests/e2e` with Playwright for cross-browser and mobile viewport verification.
- Implement the responsive PWA shell with a persistent mode toggle (Planner Mode vs. Companion Mode).
- Integrate MapLibre GL JS to render OpenStreetMap tiles fullscreen with zoom/pan and geolocation controls.
- Provide a `docker-compose.yml` configuration allowing local development and container execution.

**Non-Goals:**
- GPX file uploading, parsing, or elevation profiling (deferred to Change 2).
- Route routing, snap-to-trail algorithms, or surface calculations (deferred to Change 3).
- Database migrations, Cloudflare D1 tables, or OAuth authentication (deferred to Change 4).
- Payment gateways and marketplace logic (deferred to future changes).

## Decisions

### 1. Monorepo Organization
- **Choice**: npm workspaces with distinct directories:
  - `apps/web`: Vite + React 19 + TypeScript frontend.
  - `apps/api`: Cloudflare Workers + Hono TypeScript API scaffold.
  - `packages/core`: Pure TypeScript shared business types and utilities (zero DOM/DB dependencies, following SOLID principles).
  - `tests/unit`: Vitest suite targeting core logic and isolated units.
  - `tests/e2e`: Playwright suite targeting end-to-end browser workflows.
- **Alternatives considered**: Single monolithic web project (rejected because it mixes backend API, core logic, and UI), pnpm/turbo (rejected for KISS; standard npm workspaces avoid extra tooling requirements).

### 2. Map Engine: MapLibre GL JS
- **Choice**: MapLibre GL JS with OpenStreetMap raster/vector tile endpoints.
- **Rationale**: Highly performant WebGL rendering, mature open-source governance (Linux Foundation), native touch gestures for mobile PWA, and no API key requirements for basic OpenStreetMap tiles.
- **Alternatives considered**: Leaflet (older architecture, less smooth on mobile vector zooming), Google Maps/Mapbox (expensive commercial licensing/API keys).

### 3. Dual Testing Architecture (Vitest & Playwright)
- **Choice**: Two distinct top-level directories: `tests/unit` and `tests/e2e`.
- **Rationale**:
  - `tests/unit` runs instantaneously using Vitest, executing domain calculations and type validations without launching a browser.
  - `tests/e2e` uses Playwright to test actual DOM rendering, PWA service worker registration, mode toggling, and mobile viewport responsive behavior (e.g. Pixel 7 / iPhone 14 viewports).
- **Alternatives considered**: Mixing unit tests inside source folders (rejected to keep production builds lean and maintain strict separation between testing concerns).

### 4. Styling & Design System
- **Choice**: Modern Vanilla CSS with CSS custom properties (design tokens) for colors, typography, elevations, and responsive breakpoints.
- **Rationale**: Zero runtime dependency, maximum CSS flexibility, compliant with modern responsive design guidelines, and avoids Tailwind complexity.

### 5. Local Docker Compose Workflow
- **Choice**: Multi-stage `Dockerfile` and `docker-compose.yml` mounting source code for hot reload or serving a production build.
- **Rationale**: Ensures any developer can run `docker compose up` without needing global Node/npm dependencies pre-configured.

## Risks / Trade-offs

- **[Risk] WebGL availability in headless CI environments during E2E testing**  
  → **Mitigation**: Configure Playwright with `--use-gl=angle` / `--use-gl=swiftshader` flags in `playwright.config.ts` to allow headless MapLibre GL testing.
- **[Risk] Browser Geolocation denial**  
  → **Mitigation**: Handle permission rejection gracefully in the UI, keeping the default map center (e.g. Netherlands / Utrecht central coordinates) and informing the user.
