## 1. Core Type-Safe Engine & Translation Catalogs

- [ ] 1.1 Create lightweight type-safe `I18nContext`, `I18nProvider`, `useTranslation()`, dynamic parameter interpolation (`t('key', { param })`), and `localStorage` persistence (`hiking_companion_locale`, strictly defaulting to `nl`) in `apps/web/src/i18n/`.
- [ ] 1.2 Build complete Dutch translation catalog (`apps/web/src/i18n/locales/nl.ts`) with all UI strings, route statuses, error alerts, and tooltips.
- [ ] 1.3 Build complete English translation catalog (`apps/web/src/i18n/locales/en.ts`) strictly type-checked against `nl.ts`.
- [ ] 1.4 Refactor `apps/web/src/content/showcase.ts` into bilingual showcase content for both `nl` and `en`.
- [ ] 1.5 Implement locale-aware distance (`formatDistance`), elevation, price (`formatPriceEur`), and dynamic `<html lang="...">` / title synchronization.

## 2. UI Component Migration & Language Switcher

- [ ] 2.1 Create `LanguageSelector.tsx` (`🇳🇱 NL` / `🇬🇧 EN`) header toggle and integrate into `Header.tsx`.
- [ ] 2.2 Migrate `Header.tsx` (brand, mode toggles, user profile dropdown, login button) to `useTranslation()`.
- [ ] 2.3 Migrate `LandingPage.tsx` to dynamically render active locale showcase content.
- [ ] 2.4 Migrate `LoginModal.tsx` and `AdminUsersModal.tsx` to `useTranslation()`.
- [ ] 2.5 Migrate `MapCanvas.tsx` (Start/Finish markers, locate button tooltips) to `useTranslation()`.
- [ ] 2.6 Migrate `App.tsx` (sidebar planner, route card, metrics, companion HUD) to `useTranslation()`.
- [ ] 2.7 Migrate `RouteEditorToolbar.tsx`, `SaveRouteModal.tsx`, `RouteLibraryModal.tsx`, and `RouteMetadataModal.tsx` to `useTranslation()`.

## 3. Automated Verification

- [ ] 3.1 Create unit tests in `tests/unit/i18n.test.ts` verifying 100% key parity between `nl` and `en`, fallback behavior, parameter interpolation, and `localStorage` persistence.
- [ ] 3.2 Verify all unit tests pass with `npm run test:unit`.
- [ ] 3.3 Verify monorepo production build succeeds with `npm run build`.
- [ ] 3.4 Create Playwright E2E test in `tests/e2e/e2e/i18n.spec.ts` asserting language toggle switches landing page and planner texts between NL and EN.
