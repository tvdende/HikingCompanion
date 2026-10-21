## ADDED Requirements

### Requirement: Development-Only Mock Authentication
The system SHALL restrict mock authentication (`POST /api/auth/mock-login`) and direct test role selection strictly to local development environments. The system SHALL reject mock authentication requests with HTTP 403 Forbidden in Test and Production environments, and SHALL exclude test role selection buttons from the login interface on deployed non-development builds.

#### Scenario: Mock login attempt on Test or Production environment
- **WHEN** a client submits a `POST /api/auth/mock-login` request while the API is running in the `test` or `production` environment
- **THEN** the API rejects the request with HTTP 403 Forbidden and an error payload stating mock authentication is only available in development

#### Scenario: Mock login attempt in local development
- **WHEN** a client submits a `POST /api/auth/mock-login` request with a valid role (`user`, `planner`, or `admin`) while running in the `development` environment (or local dev with mock auth enabled)
- **THEN** the API provisions or retrieves the mock user with the requested role, establishes an authenticated session cookie, and returns HTTP 200

#### Scenario: Test role selection UI visibility on deployed environments
- **WHEN** a visitor opens the login modal on a deployed Test or Production frontend build
- **THEN** the modal displays only the OAuth login providers (Google, Microsoft, GitHub) and completely omits the test role quick-login buttons

#### Scenario: Test role selection UI visibility in local development
- **WHEN** a developer opens the login modal on the local development frontend server
- **THEN** the modal displays the test role quick-login buttons (`Wandelaar`, `Route Planner`, `Beheerder`) under the local development section
