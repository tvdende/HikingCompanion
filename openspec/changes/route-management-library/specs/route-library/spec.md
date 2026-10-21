## Purpose

Enables route planners and creators to organize, curate, search, edit metadata, and manage the lifecycle of their created hiking routes with draft and definitive statuses, location tags, and marketplace pricing.

## ADDED Requirements

### Requirement: Route Metadata and Lifecycle Status
The system SHALL support assigning a lifecycle status (`draft` for concept routes, `definitive` for published or finalized routes), an extensive text/markdown description, geographic location or region, and a marketplace price in EUR to every route record.

#### Scenario: Planner saves a concept route as draft
- **WHEN** a route planner saves a newly created or edited route with status set to `draft`
- **THEN** the route is stored with `draft` status, allowing ongoing edits without marking it complete for public listing

#### Scenario: Planner publishes route as definitive
- **WHEN** a route planner sets a route's status to `definitive` and submits
- **THEN** the system updates the route status to `definitive`, marking it as an official, verified route ready for public viewing or sale

#### Scenario: Planner specifies location and description
- **WHEN** a user fills in the geographic location (e.g. "Veluwezoom, Gelderland") and detailed description
- **THEN** the system persists these attributes and displays them in the route overview and library

#### Scenario: Planner configures marketplace price
- **WHEN** a planner sets a price in EUR for their route (e.g. 2.99 or 0.00 for free)
- **THEN** the system stores the decimal price and surfaces the price tag on the route card

### Requirement: Route Management Dashboard and Search Filtering
The system SHALL provide a centralized Route Management Dashboard modal that lists the planner's routes with status badges, allows filtering by lifecycle status (`all`, `draft`, `definitive`), full-text search by title or location, and sorting by last updated.

#### Scenario: Filtering routes by status tab
- **WHEN** the planner clicks the "Concepten" filter tab in the dashboard
- **THEN** the library view displays only routes marked with status `draft`

#### Scenario: Searching routes by keyword
- **WHEN** the planner types a search query matching a title or location name
- **THEN** the library immediately filters the visible routes to matching results

#### Scenario: Deleting a route from the library
- **WHEN** the planner triggers delete on a route and confirms the deletion prompt
- **THEN** the route is permanently removed from the database and the dashboard list refreshes

### Requirement: In-Place Route Metadata Editing
The system SHALL provide a dedicated metadata editing dialog allowing planners to update the title, status, description, location, and price of an existing route without requiring re-drawing of the trail geometry.

#### Scenario: Updating route metadata
- **WHEN** the user opens the metadata editor for a saved route, modifies description and price, and saves
- **THEN** the API updates the route's metadata via `PUT /api/routes/:id` and reflects the changes in the library and active route card
