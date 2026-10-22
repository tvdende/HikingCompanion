# Design: Internationalization (NL & EN Localization)

## Architecture

```
+---------------------------------------------------------------------------------------+
|                                      apps/web                                         |
|                                                                                       |
|   +------------------------------------+       +----------------------------------+   |
|   |   I18nContext / useTranslation()   | <---> |   LanguageSelector.tsx           |   |
|   | - locale: 'nl' | 'en' (default: nl)|       | - 🇳🇱 NL / 🇬🇧 EN Header Toggle    |   |
|   | - setLocale(locale)                |       +----------------------------------+   |
|   | - t(key, params): string           |                                              |
|   | - formatDistance(km): string       | --->  localStorage.hiking_companion_locale   |
|   | - formatPriceEur(eur): string      | --->  document.documentElement.lang = locale |
|   +------------------+-----------------+                                              |
|                      |                                                                |
|         +------------+------------+-------------------------+                         |
|         v                         v                         v                         |
|   locales/nl.ts             locales/en.ts            content/showcase.ts              |
|   (Source catalog)         (Type-checked vs NL)      (nl & en showcase data)          |
+---------------------------------------------------------------------------------------+
```

## Lightweight Type-Safe Engine (`apps/web/src/i18n/`)

Zero external dependencies; standard React Context + TypeScript:
```typescript
export type Locale = 'nl' | 'en';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatDistance: (km: number) => string;
  formatPriceEur: (eur: number) => string;
}
```

### Type-Safe Translation Keys
The `TranslationKey` type is derived directly from the Dutch catalog structure:
```typescript
import { nl } from './locales/nl';
export type TranslationKey = Paths<typeof nl>;
// Example: 'nav.planner' | 'library.statusDraft' | 'common.save'
```
TypeScript will throw compile errors if an unknown key is passed to `t()`, or if `en.ts` is missing any key defined in `nl.ts`.

### Parameter Interpolation
Strings with tokens like `"{title}"` or `"{count}"` are dynamically replaced:
```typescript
t('library.deleteConfirm', { title: 'Veluwe Trail' });
// nl: "Weet je zeker dat je route 'Veluwe Trail' wilt verwijderen?"
// en: "Are you sure you want to delete route 'Veluwe Trail'?"
```

## Structure of Translation Catalogs
Translation files `apps/web/src/i18n/locales/nl.ts` and `en.ts` organized into modular namespaces:
- `common`: Generic actions (Save, Cancel, Close, Edit, Delete, Loading, Error, Regio)
- `nav`: Brand, mode toggles (Planner, Companion), user menu (Logout, Admin Users), Login button
- `planner`: Route planning, routing profiles (Trails / Straight line), history (Undo/Redo), reverse, clear
- `library`: Route management, status filters (All, Drafts, Definitive), search, cards, actions
- `metadata`: Dialog fields, route status options, price, location, description, validation alerts
- `auth`: Login modal title, OAuth providers, test development mock roles (Hiker, Planner, Admin)
- `admin`: User management table, role badges, activate/block buttons, confirmation alerts
- `map`: Start/Finish marker popups, locate user tooltip, fallback notices
- `hud`: Live companion HUD stats (Distance, Elevation, Speed, Active Hiking Mode)

## Landingspagina Showcase Content (`apps/web/src/content/showcase.ts`)
The showcase content is exported as a record keyed by locale:
```typescript
export const showcaseContent: Record<Locale, ShowcaseData> = {
  nl: { hero: { ... }, features: [ ... ], interactiveDemo: { ... }, loginGuide: { ... } },
  en: { hero: { ... }, features: [ ... ], interactiveDemo: { ... }, loginGuide: { ... } },
};
```
When `locale` switches, `LandingPage.tsx` immediately re-renders the complete landing page in the selected language.
