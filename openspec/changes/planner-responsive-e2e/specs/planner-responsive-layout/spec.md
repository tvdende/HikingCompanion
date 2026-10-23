## Purpose

Guarantees that every planner capability is visible and usable on the four
supported device categories, and that this is continuously verified with a
dedicated end-to-end suite that also produces per-category screenshots for
manual review.

## ADDED Requirements

### Requirement: Supported planner device categories
The system SHALL support the planner on four device categories, each defined by a representative, commonly used viewport:

| Category | Viewport | Input |
|---|---|---|
| mobile | 360×800 (Android phone) | touch |
| tablet | 820×1180 (iPad Air, portrait) | touch |
| laptop | 1366×768 | mouse and keyboard |
| desktop | 1920×1080 | mouse and keyboard |

Every planner capability SHALL be available in every category. Interaction methods MAY differ per category, for example using buttons instead of dragging on touch devices.

#### Scenario: Planner opens on each category
- **WHEN** a signed-in planner opens the application in Planner Mode on any supported category
- **THEN** the header, map, planner panel, and the primary actions to start a route, import GPX, and open the route library are visible and usable

### Requirement: Planner controls are visible and unobstructed
On every supported category, each planner control needed for the current step SHALL be fully inside the viewport or reachable by scrolling its own container. It SHALL NOT be covered by another element when the user interacts with it. The page itself SHALL NOT scroll horizontally. Wide data tables are the exception and MAY scroll horizontally inside their own container. Truncated text SHALL expose its full value, for example through a tooltip.

#### Scenario: Toolbar and planner panel do not overlap
- **WHEN** route editing is active on any supported category
- **THEN** the editor toolbar, planner panel, map controls, and toast area do not overlap each other

#### Scenario: All editor toolbar actions are reachable
- **WHEN** route editing is active on the mobile category
- **THEN** every editor toolbar action can be reached and activated without any action being permanently hidden

#### Scenario: No horizontal page scroll
- **WHEN** any planner step is shown on any supported category
- **THEN** the document width does not exceed the viewport width

#### Scenario: Route library table scrolls within its container
- **WHEN** the route library is open on the mobile or tablet category
- **THEN** the routes table may scroll horizontally inside the dialog, and every row action stays reachable

### Requirement: Planner is usable on touch and small screens
On the mobile and tablet categories, interactive planner controls SHALL have a touch target of at least 44×44 CSS pixels. Map markers and route handles are excluded from this size rule, but SHALL remain tappable. On every category, the map area not covered by the header or the planner panel SHALL be at least 40% of the viewport height while the planner panel is in its default open state. Small floating overlays, such as the editor toolbar and map controls, do not count as covering the map. Dialogs SHALL fit within the viewport and scroll internally when their content is taller.

#### Scenario: Touch targets on touch categories
- **WHEN** the planner is shown on the mobile or tablet category
- **THEN** each visible interactive planner control measures at least 44×44 CSS pixels

#### Scenario: Map drawing area remains available
- **WHEN** the planner panel is in its default open state with an active multi-stage route on any supported category
- **THEN** the map area not covered by the header or planner panel is at least 40% of the viewport height, and a tap on it adds a waypoint

#### Scenario: Dialog fits the viewport
- **WHEN** the save route, route metadata, GPX import, confirmation, or route library dialog is open on any supported category
- **THEN** the dialog fits within the viewport, its primary and cancel actions are reachable, and overflowing content scrolls inside the dialog

### Requirement: Responsive verification suite covers all planner capabilities
The project SHALL provide an end-to-end suite that runs only on the four supported categories. It SHALL exercise every planner capability: session and Planner/Companion switching, language switching, map controls, route drawing and editing, stage management, the route summary and surface analysis, GPX import and export, saving, the route library, and in-app feedback. The suite SHALL assert the visibility and usability rules above and SHALL run without external network services.

#### Scenario: Suite runs per category
- **WHEN** a developer runs the responsive planner suite
- **THEN** every planner capability test runs once for each of the four categories and passes

#### Scenario: Existing suite is not multiplied
- **WHEN** a developer runs the existing end-to-end projects
- **THEN** the responsive planner suite is not included in them

### Requirement: Per-category planner flow screenshots
The responsive verification suite SHALL capture full-page screenshots at defined steps of the planner flow, and SHALL store them in a separate folder per device category with ordered, descriptive file names. Screenshots are documentation for manual review. They SHALL NOT cause a test to fail and SHALL NOT be compared with baseline images.

#### Scenario: Screenshots are grouped by category
- **WHEN** the responsive planner suite completes
- **THEN** the screenshot output contains `mobile`, `tablet`, `laptop`, and `desktop` folders, each with the same ordered set of step screenshots such as `01-planner-empty.png` and `02-route-drawn.png`

#### Scenario: Screenshot changes do not fail a test
- **WHEN** the planner behaves correctly but a screenshot differs from a previous run
- **THEN** the test still passes and the new screenshot replaces the previous file
