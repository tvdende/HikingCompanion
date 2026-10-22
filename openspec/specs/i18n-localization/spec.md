# i18n-localization Specification

## Purpose
Enable full bilingual operation of Hiking Companion in Dutch (default) and English across all UI views, toolbars, dialogs, map controls, and notifications.

## Requirements

### Requirement: Strict Dutch Default & Language Selection
The frontend application SHALL:
- Default strictly to Dutch (`nl`) for all visitors on initial launch, regardless of browser or OS language settings
- Provide a visible, accessible language toggle button (`🇳🇱 NL` / `🇬🇧 EN`) in the top navigation header bar
- Persist the chosen language in `localStorage` under key `hiking_companion_locale`
- Update the document root `<html lang="...">` and document `<title>` immediately when the locale changes
- Apply translations strictly to all system and interface texts (buttons, dialogs, forms, alerts, tooltips, map controls, and showcase marketing); user-generated route titles, descriptions, and custom notes remain in the language entered by the creator

#### Scenario: First-time visitor opening the app on an English system
- **GIVEN** a new visitor whose operating system or browser is set to English
- **WHEN** the app loads for the first time
- **THEN** all interface elements and the landing page MUST be rendered in Dutch (`nl`)
- **AND** only switch to English if the visitor explicitly clicks the `EN` language toggle

#### Scenario: User switches to English
- **GIVEN** the app is displaying Dutch texts
- **WHEN** the user clicks the language toggle and selects `EN`
- **THEN** all interface labels, buttons, tooltips, modal titles, and showcase cards switch immediately to English without a page reload
- **AND** `<html lang="en">` is set on the document element
- **AND** the choice is remembered across future sessions in `localStorage`

### Requirement: Full System Text Coverage
Every visible text, button label, dialog message, error prompt, tooltip, and showcase item MUST be translated:
- Navigation & Header (`Header.tsx`): Brand title, mode toggles (Planner, Companion), user menu (Logout, Admin Users), Login button
- Landing Page & Showcase (`LandingPage.tsx`, `showcase.ts`): Hero headline/subheadline/badges/CTAs, 6 feature cards, interactive demo preview cards/stats/explanations, 3-step login guide, and footer callouts
- Route Planner & Sidebar (`App.tsx`): Route summary card, status badges, distance/gain/loss/stages/points metrics, empty state action buttons, companion HUD live stats
- Editor Toolbar (`RouteEditorToolbar.tsx`): Edit mode toggle, snapping profiles (Paden / Trails, Recht / Straight), history controls (Undo/Redo), reverse, clear, save, and library buttons
- Route Library & Details (`RouteLibraryModal.tsx`): Filter tabs (All, Drafts, Definitive), search input, load/manage/delete buttons, deletion confirm dialog
- Route Metadata & Save Dialogs (`RouteMetadataModal.tsx`, `SaveRouteModal.tsx`): Form labels, draft/definitive selector options, price and location inputs, validation error alerts
- Authentication Modal (`LoginModal.tsx`): Title, OAuth provider buttons (Google, Microsoft, GitHub), test development mock roles (Wandelaar / Hiker, Planner, Beheerder / Admin)
- Admin Management (`AdminUsersModal.tsx`): User table headers, role badges, action buttons (Block/Activate), user addition dialog
- Map Canvas (`MapCanvas.tsx`): Start/Finish marker popups, locate user button tooltip and aria-labels

#### Scenario: Switching language translates all application screens
- **GIVEN** the user navigates across different screens (landing page, planner, library modal, admin modal)
- **WHEN** the user views any of these screens in English
- **THEN** all navigation, form labels, actions, and empty states MUST be displayed in English

### Requirement: Parameter Interpolation & Pluralization
The translation engine SHALL support dynamic variable interpolation:
- Support token replacement syntax `t('key', { name: value })` (e.g. `t('library.deletePrompt', { title: 'Veluwe' })`)
- Support count-based pluralization / status counters (e.g. `Alle Routes ({count})` -> `All Routes ({count})`)

#### Scenario: Interpolating dynamic values in translation strings
- **GIVEN** a route named "Veluwe Heuvelrug"
- **WHEN** the user initiates route deletion
- **THEN** the confirmation prompt MUST display the dynamic title interpolated into the translated string

### Requirement: Locale-Aware Formatting
The system SHALL format numbers, dates, times, and currencies according to the active locale:
- Hiking distances and elevation MUST remain metric (kilometers and meters: `km` and `m`) in both Dutch and English
- Dutch (`nl`): comma decimal separator (`14,2 km`), 24-hour time (`14:30`), date format `DD-MM-YYYY`, currency `€ 3,50`
- English (`en`): dot decimal separator (`14.2 km`), 24-hour/12-hour support, date format `YYYY-MM-DD` / `MMM D, YYYY`, currency `€3.50`

#### Scenario: Formatting numbers and distance per locale
- **GIVEN** a route with distance 14.25 km
- **WHEN** viewed in Dutch locale
- **THEN** the distance MUST be formatted as "14,25 km"
- **AND WHEN** viewed in English locale
- **THEN** the distance MUST be formatted as "14.25 km"
