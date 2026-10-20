# pwa-shell Specification

## Purpose
Provides a responsive Progressive Web App shell with dual operational modes (Planner Mode and Companion Mode), authentication status triggers, guest landing routing, and service worker registration for offline readiness.

## Requirements

### Requirement: Uniform Application Shell
The application SHALL render a responsive layout with a top navigation bar, main view area, and accessible controls suitable for both mobile and desktop screen sizes, selectively displaying the guest landing page for unauthenticated visitors and the map workspace for authenticated users.

#### Scenario: Viewport adaptability
- **WHEN** the user opens the application on desktop or mobile
- **THEN** the layout adapts responsively to the viewport dimensions without broken elements or horizontal overflow

#### Scenario: Unauthenticated visitor view routing
- **WHEN** the user is not authenticated
- **THEN** the application shell renders the top navigation bar and mounts the guest landing page in the main view area instead of the map canvas

#### Scenario: Authenticated user view routing
- **WHEN** the user is authenticated
- **THEN** the application shell renders the full interactive map canvas, route editing tools, and active mode controls

### Requirement: Mode Switcher
The application SHALL provide a toggle mechanism to switch between Planner Mode (optimized for route editing) and Companion Mode (optimized for on-trail navigation).

#### Scenario: Switching to Companion Mode
- **WHEN** the user toggles the mode switch to Companion Mode
- **THEN** the application updates the UI state, displaying large high-contrast controls and hiding desktop planning toolbars

#### Scenario: Switching to Planner Mode
- **WHEN** the user toggles the mode switch to Planner Mode
- **THEN** the application updates the UI state, presenting planning sidebars and route management panels

### Requirement: Authentication Status Trigger
The application header SHALL render an authentication trigger displaying an "Inloggen" button for guests, and a user profile avatar with dropdown menu (showing name, role badge, Admin Management link for admins, and logout action) for authenticated users.

#### Scenario: Unauthenticated visitor
- **WHEN** an unauthenticated visitor opens the application
- **THEN** the header displays the "Inloggen" button which opens the OAuth provider selection modal upon click

#### Scenario: Authenticated regular user
- **WHEN** an authenticated user with role `user` or `planner` opens the application
- **THEN** the header displays the user's avatar, name, and role badge with a logout action in the profile menu

#### Scenario: Authenticated administrator
- **WHEN** an authenticated user with role `admin` opens the application
- **THEN** the header profile menu includes a prominent "Gebruikersbeheer" action that opens the administrative user panel

### Requirement: Administrative User Management Interface
The PWA SHALL provide an administrative user management view accessible exclusively to users with the `admin` role, allowing them to search registered users, change roles, deactivate/activate accounts, and delete users.

#### Scenario: Admin opens and uses user management
- **WHEN** an administrator clicks "Gebruikersbeheer"
- **THEN** a management panel opens showing all registered users with controls to filter, change roles (`user`, `planner`, `admin`), toggle active status, and remove users

### Requirement: Service Worker Registration
The application SHALL register a service worker in compliant browsers to enable Progressive Web App installation and offline asset caching.

#### Scenario: Service worker active
- **WHEN** the application loads in a browser supporting Service Workers
- **THEN** the service worker is registered successfully and precaches essential application shell assets
