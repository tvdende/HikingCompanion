## Context

The foundation change established the PWA and API shell. All upcoming persistence features (saving routes, sharing, POI favorites, payments) require a definitive user and database identity. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Provision Cloudflare D1 SQLite database with Drizzle ORM schemas in `apps/api`.
- Create tables: `users`, `sessions`, `oauth_accounts`.
- Implement OAuth 2.0 authentication endpoints for Google, Microsoft, and GitHub in Hono (`apps/api`).
- **Zero-barrier self-registration**: automatic account provisioning on first OAuth login without manual approval or waitlists.
- **Administrative User Management**: endpoints and UI for users with role `admin` to list all users, change roles, deactivate/activate accounts, and delete users.
- Support a local development mock auth mode (`MOCK_AUTH=true`) allowing developers to test without needing production OAuth client secrets.
- Implement session validation middleware and user profile endpoint `/api/auth/me`.
- Integrate login modal, avatar, role badge, and Admin User Management view into `apps/web`.

**Non-Goals:**
- Route or POI database tables (deferred to subsequent changes).
- Paid subscription billing webhooks (deferred to marketplace change).

## Decisions

### 1. Database & ORM: Cloudflare D1 + Drizzle ORM
- **Choice**: Cloudflare D1 managed SQLite with Drizzle ORM (`drizzle-orm/d1`).
- **Rationale**: Direct edge integration, zero latency, typesafe schema definitions, and migration generation via `drizzle-kit`.
- **Local Dev**: Runs against local SQLite via Wrangler (`--local`).
- **Schema (`users`)**:
  - `id`: text primary key (UUID/nanoid)
  - `email`: text unique not null
  - `name`: text not null
  - `avatarUrl`: text
  - `role`: text not null default `'user'` (`'admin' | 'planner' | 'user'`)
  - `isActive`: integer (boolean) not null default `1`
  - `createdAt`: integer (timestamp) not null
  - `lastLoginAt`: integer (timestamp) not null

### 2. Session Architecture: Stateful Database Sessions
- **Choice**: Sessions stored in the `sessions` table with a secure 256-bit random token stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- **Rationale**: Immediate revocation on logout or account deactivation, avoids JWT stale token risks, and conforms to strict security standards.

### 3. Multi-Provider OAuth with Zero-Barrier Self-Registration & Local Mock Mode
- **Choice**: Standard OAuth 2.0 authorization code flow with state/PKCE.
- **Zero-Barrier Self-Registration**:
  - When the OAuth callback verifies the user identity, the API queries `oauth_accounts`.
  - If the external account does not exist, a new `users` record is immediately inserted with `role: 'user'` and `isActive: 1`, linked to the new `oauth_account`. No admin approval or verification delay is required.
  - If the account exists and `isActive` is `0` (suspended), the session creation is rejected with an HTTP 403 error.
- **Mock Mode**: When running locally without OAuth credentials, the API enables a mock login endpoint allowing instant switching between Admin, Planner, and Free User roles, enabling rapid test execution.

### 4. Administrative User Management & RBAC
- **Roles**:
  - `admin`: Full access to admin user management, system dashboards, and settings.
  - `planner`: Authorized to curate and publish public routes.
  - `user`: Default role for standard accounts.
- **Admin API Endpoints**:
  - Protected with `requireAdmin` middleware (`session.user.role === 'admin'`).
  - `GET /api/admin/users`: Returns all users with optional query/search filtering.
  - `PATCH /api/admin/users/:id`: Updates `role` (`'user' | 'planner' | 'admin'`) and/or `isActive` status. Setting `isActive = 0` immediately purges all active sessions for that user.
  - `DELETE /api/admin/users/:id`: Deletes the user and cascades deletion of OAuth links and sessions. An admin cannot delete their own active account.
- **Admin UI**:
  - Accessible via the profile dropdown menu in `apps/web/src/components/Header.tsx` only when `user.role === 'admin'`.
  - Displays `AdminUsersModal` with a responsive table of users, role selection dropdowns, active/blocked toggles, and delete action with confirmation.

## Risks / Trade-offs

- **[Risk] OAuth credentials missing during local setup**  
  → **Mitigation**: Implement `MOCK_AUTH=true` for local development and E2E tests, allowing tests to run predictably without external internet dependencies.
- **[Risk] Session cookie cross-domain issues in local Vite (port 5173) vs Worker (port 8787)**  
  → **Mitigation**: Configure Vite reverse proxy in `vite.config.ts` (`/api` → `http://localhost:8787`), ensuring cookies are first-party to `localhost:5173`.
- **[Risk] Admin locking themselves out**  
  → **Mitigation**: Prevent admins from demoting their own role or deactivating/deleting their own account in the admin API.
