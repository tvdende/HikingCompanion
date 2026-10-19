## Why

The Hiking Companion project requires a robust, testable, and maintainable foundation before implementing complex routing, POI analysis, or live navigation features. Establishing the monorepo structure, development workflow (local Node/Vite and Docker Compose), automated testing harnesses (Vitest and Playwright), and the core PWA shell with a functional MapLibre GL map provides the necessary groundwork for all subsequent feature changes.

## What Changes

- **Monorepo & Project Scaffolding**: Setup npm workspaces with `apps/web` (React 19 + TypeScript + Vite PWA), `apps/api` (Cloudflare Worker scaffold), and `packages/core` (shared types and business logic).
- **Two Separate Testing Projects**:
  - `tests/unit`: Vitest test harness for unit and domain tests.
  - `tests/e2e`: Playwright test suite configured for desktop browsers and mobile viewports (e.g. iPhone, Android).
- **PWA Application Shell**: Responsive web application with `vite-plugin-pwa` service worker registration, installability, and a clear mode toggle between **Planner Mode** and **Companion Mode**.
- **Interactive Map Canvas**: Fullscreen MapLibre GL JS integration rendering OpenStreetMap tiles with responsive controls and mock/live GPS geolocation indicators.
- **Local Dev & Containerization**: `docker-compose.yml` to spin up the local development environment in a single command.

## Capabilities

### New Capabilities
- `pwa-shell`: Uniform Progressive Web App shell with mode switching (Planner vs. Companion), responsive layout, and service worker registration for offline capability.
- `map-viewer`: Interactive vector/raster map component powered by MapLibre GL JS, featuring pan/zoom controls, OpenStreetMap base layer, and user geolocation visualization.

### Modified Capabilities
<!-- None: Greenfield project -->

## Impact

- Establishes root project configuration, package scripts, build tools, and container definitions.
- Sets the standards for code quality (SOLID, DRY, KISS) and testing across the codebase.
- Provides immediate developer feedback with `npm run test:unit` and `npm run test:e2e`.
