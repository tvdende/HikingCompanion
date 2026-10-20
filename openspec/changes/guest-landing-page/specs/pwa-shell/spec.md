## MODIFIED Requirements

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
