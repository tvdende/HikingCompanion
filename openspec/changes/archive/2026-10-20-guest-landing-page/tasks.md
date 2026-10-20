## 1. Source Content Architecture

- [x] 1.1 Create `apps/web/src/content/showcase.ts` with typed interfaces and structured content covering hero messaging, core capabilities (GPX route & elevation analysis, dual Planner/Companion modes, offline vector maps), interactive demo preview scenarios, and login instructions. Verify compilation via `npm run build`.

## 2. Landing Page Component & Interactive Showcase

- [x] 2.1 Create `apps/web/src/components/LandingPage.tsx` rendering the hero banner, value proposition cards, interactive tabbed demo widget (simulating GPX elevation profiles, Planner vs Companion HUD, and offline caching), and login CTA buttons. Verify component imports and renders without errors.
- [x] 2.2 Add comprehensive CSS styles in `apps/web/src/index.css` for the guest showcase, including responsive grid layouts, preview card tabs, high-contrast badges, and dark-theme integration. Verify visual presentation on mobile and desktop viewports.

## 3. Application Shell View Routing & Verification

- [x] 3.1 Update `apps/web/src/App.tsx` to conditionally render `<LandingPage />` for unauthenticated guests (`!user`) and `<MapCanvas />` with the route planning sidebar for authenticated users (`user`). Verify that clicking login CTAs opens `LoginModal` and logging in transitions directly to the map workspace.
- [x] 3.2 Update and expand E2E test suites in `tests/e2e` to verify that unauthenticated visitors see the product showcase with feature demos and login actions, while authenticated users access the map planner. Verify all unit and E2E tests pass via `npm run test:unit` and `npm run test:e2e`.
