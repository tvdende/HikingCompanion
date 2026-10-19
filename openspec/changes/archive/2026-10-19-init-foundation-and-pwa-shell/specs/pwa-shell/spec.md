## Purpose

Provides a responsive Progressive Web App shell with dual operational modes (Planner Mode and Companion Mode) and service worker registration for offline readiness.

## ADDED Requirements

### Requirement: Uniform Application Shell
The application SHALL render a responsive layout with a top navigation bar, main view area, and accessible controls suitable for both mobile and desktop screen sizes.

#### Scenario: Viewport adaptability
- **WHEN** the user opens the application on desktop or mobile
- **THEN** the layout adapts responsively to the viewport dimensions without broken elements or horizontal overflow

### Requirement: Mode Switcher
The application SHALL provide a toggle mechanism to switch between Planner Mode (optimized for route editing) and Companion Mode (optimized for on-trail navigation).

#### Scenario: Switching to Companion Mode
- **WHEN** the user toggles the mode switch to Companion Mode
- **THEN** the application updates the UI state, displaying large high-contrast controls and hiding desktop planning toolbars

#### Scenario: Switching to Planner Mode
- **WHEN** the user toggles the mode switch to Planner Mode
- **THEN** the application updates the UI state, presenting planning sidebars and route management panels

### Requirement: Service Worker Registration
The application SHALL register a service worker in compliant browsers to enable Progressive Web App installation and offline asset caching.

#### Scenario: Service worker active
- **WHEN** the application loads in a browser supporting Service Workers
- **THEN** the service worker is registered successfully and precaches essential application shell assets
