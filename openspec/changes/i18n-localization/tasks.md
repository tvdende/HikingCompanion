## 1. Core i18n Engine & Catalogs

- [ ] 1.1 Create `i18n` context, hook (`useTranslation`), and locale storage in `apps/web/src/i18n/index.tsx`.
- [ ] 1.2 Build complete Dutch translation catalog (`nl.json`) covering all application modules with `nl` set as default.
- [ ] 1.3 Build complete English translation catalog (`en.json`) matching all translation keys.

## 2. UI Component Migration & Language Switcher

- [ ] 2.1 Create `LanguageSelector.tsx` dropdown / toggle component and integrate into the header navigation bar.
- [ ] 2.2 Migrate `App.tsx`, `RouteEditorToolbar.tsx`, `SaveRouteModal.tsx`, `RouteLibraryModal.tsx`, and `RouteMetadataModal.tsx` to use `t()` translation keys.
- [ ] 2.3 Add locale-aware distance and currency formatting helpers (`formatDistance`, `formatPriceEur`).

## 3. Verification

- [ ] 3.1 Run unit tests (`npm run test:unit`) ensuring missing key validation and language switcher state persistence.
- [ ] 3.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 3.3 Add a Playwright E2E test in `tests/e2e/e2e/i18n.spec.ts` toggling language between NL and EN and asserting UI text updates.
