## 1. Domain Types & Navigation Math

- [ ] 1.1 Define `NavigationState`, `NavigationMetrics`, and `NavigationOptions` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Implement cross-track distance, polyline projection, and Tobler hiking pace algorithms in `packages/core/src/navigation/math.ts` with unit tests.

## 2. Navigation Engine & Hardware APIs

- [ ] 2.1 Implement `NavigationManager.ts` in `apps/web/src/services/navigation.ts` managing `watchPosition`, orientation, smoothing, and deviation detection.
- [ ] 2.2 Implement Screen Wake Lock hook/service in `apps/web/src/hooks/useWakeLock.ts`.
- [ ] 2.3 Implement haptic and audio off-trail alerting in `apps/web/src/services/alerts.ts`.

## 3. Web UI & Companion Focus View

- [ ] 3.1 Create `CompanionFocusView.tsx` with glove-friendly large buttons, dark/light contrast modes, elevation stats, and SOS coordinate display.
- [ ] 3.2 Update MapLibre canvas with live hiker location pulse, accuracy radius, heading cone, and camera follow toggle.
- [ ] 3.3 Add "Start Navigatie" action in `App.tsx` and route header bar.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying cross-track distance and ETA math.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/live-navigation.spec.ts` mocking geolocation emissions and verifying UI metrics updates.
