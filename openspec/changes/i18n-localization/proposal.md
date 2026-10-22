## Why

To make Hiking Companion accessible to both international and Dutch-speaking hikers and trail creators, the platform must support complete bilingual localization. All user interface text, navigation controls, map tooltips, error alerts, dialogs, route metadata labels, and the landing page showcase must be available in both Dutch and English, with Dutch (`nl`) serving strictly as the default language. Users can switch their preferred language dynamically at any time via a header toggle, with their choice persisting in `localStorage`.

## What Changes

- **Lightweight Type-Safe i18n Engine**: Implement a zero-dependency, type-safe React Context (`I18nProvider` + `useTranslation()`) in `apps/web/src/i18n/` with compile-time checked translation keys and parameter interpolation (`t('key', { param })`).
- **Strict Dutch Default**: Ensure `nl` is strictly the default active locale on first visit for all visitors regardless of OS or browser language. When the user switches to English, the choice is persisted in `localStorage` under `hiking_companion_locale`.
- **Language Switcher UI**: Add a compact, accessible language toggle (`🇳🇱 NL` / `🇬🇧 EN`) to the top navigation header bar.
- **Landing Page Multilingual Showcase**: Make `apps/web/src/content/showcase.ts` bilingual so that the entire landing page (hero, 6 feature cards, interactive demo preview explanations, 3-step login guide, and CTAs) updates seamlessly when switching languages.
- **Coverage Across All UI Components**:
  - `Header.tsx`: Mode toggles (Planner/Companion), brand title, user menu (Logout, Admin), login button.
  - `LandingPage.tsx`: Full bilingual showcase integration.
  - `LoginModal.tsx`: Dialog titles, OAuth provider descriptions, mock test role descriptions.
  - `AdminUsersModal.tsx`: User management tables, role badges, action buttons, confirmation prompts.
  - `MapCanvas.tsx`: Marker popups (Start, Finish), geolocation button tooltips and accessibility labels.
  - `App.tsx`: Route planner sidebar, route status badges, elevation gain/loss, stage metrics, HUD live navigation.
  - `RouteEditorToolbar.tsx`: Snapping mode toggles, undo/redo, route reversal, clearing, and save buttons.
  - `RouteLibraryModal.tsx`: Filter tabs (All, Drafts, Definitive), search placeholder, route card actions, delete prompts.
  - `RouteMetadataModal.tsx` & `SaveRouteModal.tsx`: Field labels, status selector options, price input, validation alerts.
- **Formatters & Document Lang**: Provide locale-aware number, distance (km/m), currency (€), date, and time formatters, and dynamically update `<html lang="nl">` / `<html lang="en">` and document `<title>`.

## Capabilities

### New Capabilities
- `i18n-localization`: Provides end-to-end bilingual support (Dutch default, English optional) across all application screens, the landing page showcase, dialogs, tooltips, and notifications with zero external dependencies, type-safety, and `localStorage` persistence.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**: `apps/web/src/i18n/`, `apps/web/src/content/showcase.ts`, `apps/web/src/App.tsx`, and all UI components in `apps/web/src/components/`.
- **Dependencies**: 0 external runtime dependencies (native React Context + TypeScript).
- **Performance**: Zero bundle bloat, zero async loading delays; completely offline-safe for PWA usage.
