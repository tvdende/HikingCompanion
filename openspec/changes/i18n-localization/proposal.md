## Why

To make Hiking Companion accessible to both international and Dutch-speaking hikers and trail creators, the platform must support complete bilingual localization. All user interface text, navigation controls, map tooltips, error alerts, dialogs, and route metadata labels must be available in both Dutch and English, with Dutch (`nl`) serving as the default language. Users can switch their preferred language dynamically at any time, with their choice persisting in local storage and user settings.

## What Changes

- **Localization Framework**: Implement a lightweight, type-safe i18n translation system in `apps/web` (or standard `i18next` / `react-i18next`) with full dictionary catalogs for Dutch (`nl`) and English (`en`).
- **Default Language**: Ensure `nl` is the default active locale on first visit, with automatic browser language detection fallback if English is preferred by the browser.
- **Language Switcher UI**: Add a language toggle (`🇳🇱 NL` / `🇬🇧 EN`) to the top navigation header and Settings modal.
- **Coverage of System Texts**:
  - Main app shell & header navigation
  - Route planner toolbar, waypoint editing, snapping modes
  - Route library dashboard, search, filters, and status badges
  - Login modal, authentication dialogs, and profile
  - Weather forecast widgets, alert badges, and POI categories
  - Companion Focus View and live navigation controls
  - Packing lists, gear manager, and printable guide interface
- **Formatters**: Provide locale-aware number, distance (km/m), currency (€), date, and time formatters.

## Capabilities

### New Capabilities
- `i18n-localization`: Provides end-to-end bilingual support (Dutch default, English optional) across all application screens, dialogs, tooltips, and system notifications with dynamic switching and persistence.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**: `apps/web/src/i18n/`, `apps/web/src/App.tsx`, and all UI components.
- **Performance**: Zero overhead; translation catalogs are lazy-loaded or bundled efficiently.
