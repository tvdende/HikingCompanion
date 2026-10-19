## 1. Monorepo & Project Scaffolding

- [x] 1.1 Initialize root `package.json` with npm workspaces (`apps/*`, `packages/*`, `tests/*`) and top-level scripts (`dev`, `build`, `test:unit`, `test:e2e`), verifying configuration with `npm install`.
- [x] 1.2 Scaffold `packages/core` with `tsconfig.json`, core domain interfaces (`Coordinate`, `HikeRoute`, `PoiCategory`, `AppMode`), and verify compilation with `npm run build -w packages/core`.
- [x] 1.3 Scaffold `apps/api` with Cloudflare Workers and Hono providing a `/api/health` endpoint, and verify compilation with `npm run build -w apps/api`.

## 2. Testing Harnesses (Unit & E2E)

- [x] 2.1 Configure `tests/unit` using Vitest and TypeScript to test domain models and utilities, and verify by running `npm run test:unit`.
- [x] 2.2 Configure `tests/e2e` using Playwright with desktop and mobile viewport profiles (iPhone 14, Pixel 7), and verify configuration with `npx playwright --version`.

## 3. PWA Application Shell

- [x] 3.1 Set up `apps/web` with Vite, React 19, TypeScript, and `vite-plugin-pwa` (manifest, icons, service worker registration), and verify build with `npm run build -w apps/web`.
- [x] 3.2 Build the responsive app shell with CSS tokens, top bar, and the mode toggle (Planner Mode vs. Companion Mode), verifying state updates in the UI.
- [x] 3.3 Add automated Playwright E2E test verifying mode switching across desktop and mobile viewports with `npm run test:e2e`.

## 4. Map Canvas Integration (MapLibre GL)

- [x] 4.1 Integrate MapLibre GL JS in `apps/web`, creating a `MapCanvas` component rendering OpenStreetMap base tiles fullscreen.
- [x] 4.2 Add navigation controls (zoom in, zoom out, compass reset) and verify responsive resizing when viewport or mode changes.
- [x] 4.3 Add a geolocation button with browser Geolocation API integration to center map and display current position marker.
- [x] 4.4 Add Playwright E2E test verifying map canvas initialization, controls, and geolocation button presence.

## 5. Docker Compose & Integration Verification

- [x] 5.1 Create `Dockerfile` and `docker-compose.yml` for running the web application and API in a local container environment.
- [x] 5.2 Validate `docker compose config` and verify that both `npm run test:unit` and `npm run test:e2e` pass without errors.
