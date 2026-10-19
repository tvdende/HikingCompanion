## Why

Setting up authentication, zero-barrier self-registration, and persistent database storage early establishes the foundation for all user-centric features: saving routes, sharing tracks, marking POI favorites, purchasing trips, and enforcing role-based permissions (Admin, Planner, Standard user limits vs. Premium). Implementing authentication and full administrator user management first ensures downstream capabilities can directly attach records to authenticated users and database tables without needing temporary client-side storage or painful refactoring later.

## What Changes

- **Self-Registration & OAuth Engine**:
  - OAuth 2.0 / OpenID Connect integration for **Google**, **Microsoft**, and **GitHub**.
  - **Zero-Barrier Self-Registration**: Any new visitor logging in via an OAuth provider automatically receives a registered account with default role `user` without requiring manual approval or waitlists.
  - Secure HTTP-only session cookie management with CSRF protection in Cloudflare Workers API.
  - Endpoints: `/api/auth/login/:provider`, `/api/auth/callback/:provider`, `/api/auth/me`, `/api/auth/logout`.
- **Administrative User Management (Admin RBAC)**:
  - Admin management endpoints restricted to `role: admin`:
    - `GET /api/admin/users`: List, search, and paginate registered users.
    - `PATCH /api/admin/users/:id`: Modify user roles (`user`, `planner`, `admin`) and account status (active/blocked).
    - `DELETE /api/admin/users/:id`: Delete user account and cascade cleanup of sessions and credentials.
  - User management interface in the PWA shell, allowing administrators to inspect users, assign planner/admin rights, and manage account statuses.
- **Cloudflare D1 Database & Drizzle ORM (`apps/api`)**:
  - D1 SQLite database binding and schema configuration.
  - Tables for `users` (with `role`, `isActive`, `lastLoginAt`), `sessions`, `oauth_accounts`.
  - Automated migration setup with Drizzle Kit.
- **Frontend PWA Auth & Admin Integration (`pwa-shell`)**:
  - Login modal and button in the PWA Header.
  - User profile menu displaying avatar, name, assigned role badge, Admin Management link (for admins), and Logout action.
  - Client-side auth state hook (`useAuth()`) providing current user session status.
  - Admin User Management modal/view for inspecting and editing user roles and statuses.

## Capabilities

### New Capabilities
- `user-auth`: Multi-provider OAuth authentication (Google, Microsoft, GitHub), zero-barrier self-registration, secure session cookie management, and administrative user management API (role changes, account blocking, user deletion).
- `database-storage`: Cloudflare D1 relational database storage with Drizzle ORM schemas and migration management for user accounts and sessions.

### Modified Capabilities
- `pwa-shell`: Adds user profile, authentication triggers, and an administrative user management view accessible to admins.

## Impact

- Introduces Drizzle ORM and D1 bindings into `apps/api`.
- Exposes authentication routes under `/api/auth/*` and admin management routes under `/api/admin/users/*`.
- Modifies `apps/web/src/components/Header.tsx` to display user login, profile status, and admin panel trigger.
- Adds mock and live auth unit tests in `tests/unit` and Playwright auth/admin tests in `tests/e2e`.
