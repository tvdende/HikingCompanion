## Purpose

Provides user authentication through standard OAuth providers (Google, Microsoft, GitHub), zero-barrier self-registration, secure session cookie management, role-based access control, and complete administrative user management.

## ADDED Requirements

### Requirement: Zero-Barrier Self-Registration and OAuth Authentication
The system SHALL support OAuth 2.0 / OpenID Connect authentication flows for Google, Microsoft, and GitHub, and SHALL automatically register new user accounts upon their first successful authentication without requiring manual approval or waitlists.

#### Scenario: New user self-registration via OAuth
- **WHEN** a visitor who does not have an account authenticates successfully via an OAuth provider
- **THEN** the system automatically provisions a new user record with default role `user`, status `active`, creates an OAuth identity link, establishes a session cookie, and logs the user in immediately

#### Scenario: Returning user OAuth login
- **WHEN** a previously registered user authenticates with their linked OAuth provider
- **THEN** the system updates their `lastLoginAt` timestamp, establishes a fresh session, and permits immediate access

#### Scenario: Blocked user login rejection
- **WHEN** a user whose account status is deactivated or blocked attempts to log in
- **THEN** the system terminates the session flow and displays a message stating the account has been suspended

#### Scenario: OAuth provider failure or cancellation
- **WHEN** an OAuth provider rejects the authentication request or the user cancels the flow
- **THEN** the system catches the error, clears transient state, and returns a user-friendly error message

### Requirement: Secure Session Management
The system SHALL issue secure, HTTP-only, SameSite session cookies upon login and invalidate them upon logout.

#### Scenario: User session validation
- **WHEN** an authenticated client makes an API request with a valid session cookie
- **THEN** the API resolves the user identity and permits access to authorized endpoints

#### Scenario: User logout
- **WHEN** the user triggers the logout action
- **THEN** the system invalidates the active session record in the database and clears the session cookie

### Requirement: Role-Based User Context
The system SHALL assign a user role (`admin`, `planner`, or `user`) to each account and provide this role in the user profile payload.

#### Scenario: Retrieve authenticated user profile
- **WHEN** the client queries `/api/auth/me` with an active session
- **THEN** the API responds with user details including ID, display name, email, avatar URL, assigned role, and status

### Requirement: Administrative User Management
The system SHALL permit administrators (users with role `admin`) to view all registered users, filter/search users, modify roles, toggle active/blocked status, and remove user accounts.

#### Scenario: Admin views user directory
- **WHEN** an administrator requests `GET /api/admin/users`
- **THEN** the API returns a paginated list of registered users including ID, name, email, role, status, provider, created timestamp, and last login timestamp

#### Scenario: Non-admin attempts to access admin endpoints
- **WHEN** an unauthenticated visitor or non-admin user requests any `/api/admin/*` endpoint
- **THEN** the API returns HTTP 403 Forbidden (or 401 Unauthorized for guests)

#### Scenario: Admin updates user role
- **WHEN** an administrator sends `PATCH /api/admin/users/:id` with a new role (e.g. `planner` or `admin`)
- **THEN** the system updates the user's role in the database and returns the updated user record

#### Scenario: Admin deactivates or blocks a user
- **WHEN** an administrator sends `PATCH /api/admin/users/:id` with `isActive: false`
- **THEN** the system updates the account status and immediately invalidates all active sessions for that user

#### Scenario: Admin deletes a user account
- **WHEN** an administrator sends `DELETE /api/admin/users/:id`
- **THEN** the system deletes the user and cascades deletion of OAuth links and sessions
