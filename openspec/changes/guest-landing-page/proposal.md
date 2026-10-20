## Why

Currently, when unauthenticated visitors open Hiking Companion, they are immediately dropped into the map workspace without context on what the application does, its capabilities, or clear onboarding. Presenting a dedicated, high-impact product showcase landing page for unauthenticated visitors clarifies the value proposition (GPX import, elevation analysis, Planner vs. Companion modes, offline readiness) and guides users into logging in. All showcase copy and demo data must be easily editable directly in source code.

## What Changes

- **Guest Landing Page View**: Introduce a responsive product showcase page that replaces the map canvas for unauthenticated visitors.
- **Feature Showcase & Demos**: Present core capabilities (GPX Import & Elevation Analysis, Dual Planner/Companion Modes, Offline Vector Maps) with interactive visual previews.
- **Login Guidance & CTAs**: Add prominent login instructions and buttons triggering the existing OAuth login modal.
- **Source-Editable Content Architecture**: Decouple all landing page copy, feature cards, and demo data into a dedicated, strongly-typed source file (`apps/web/src/content/showcase.ts`) that can be edited directly in source control without touching UI component logic.
- **Authentication-Gated View Routing**: Update the main application shell to render the Guest Landing Page when unauthenticated, and the full map/planning workspace when logged in.

## Capabilities

### New Capabilities
- `landing-page`: Product showcase landing page for unauthenticated visitors, presenting application features, interactive preview demos, and login instructions, with all content sourced from an easily editable source configuration file.

### Modified Capabilities
- `pwa-shell`: Gate the map view and planning tools behind user authentication, displaying the guest landing page when unauthenticated.

## Impact

- `apps/web/src/App.tsx`: Conditional view rendering based on authentication status (`user !== null`).
- `apps/web/src/components/LandingPage.tsx`: New responsive landing component rendering hero, feature showcase cards, interactive demos, and login CTA.
- `apps/web/src/content/showcase.ts`: Dedicated content module providing easily editable copy and demo metadata.
- `apps/web/src/index.css`: Styling for the landing showcase (hero section, feature cards, badge accents, dark-mode compatible layout).
- `tests/e2e`: Update and expand E2E test flows to verify that unauthenticated visitors land on the showcase page and can open the login modal.
