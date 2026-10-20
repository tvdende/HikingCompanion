## 1. Database Schema and Drizzle Setup

- [x] 1.1 Install `drizzle-orm` and `drizzle-kit` in `apps/api` and verify package installation succeeds
- [x] 1.2 Create D1 SQLite schema definitions (`users` with role, isActive, lastLoginAt; `sessions`; `oauth_accounts`) in `apps/api/src/db/schema.ts` and verify TypeScript compiles without errors
- [x] 1.3 Configure Drizzle Kit config in `apps/api/drizzle.config.ts` and verify initial migration file generation with `npx drizzle-kit generate`
- [x] 1.4 Add D1 database binding in `apps/api/wrangler.jsonc` and verify local database access

## 2. Authentication API and Session Management

- [x] 2.1 Implement session token generation, cookie helpers, and auth middleware (`requireAuth`, `requireAdmin`) in `apps/api/src/auth/session.ts` and verify unit tests pass
- [x] 2.2 Implement OAuth route handlers with zero-barrier self-registration (`/api/auth/login/:provider`, `/api/auth/callback/:provider`, `/api/auth/logout`, `/api/auth/me`) in `apps/api/src/routes/auth.ts` and verify endpoints respond
- [x] 2.3 Implement development mock auth endpoint (`/api/auth/mock-login`) controlled by `MOCK_AUTH=true` for local development and testing, and verify login/logout state transitions in tests
- [x] 2.4 Implement admin user management routes (`GET /api/admin/users`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id`) in `apps/api/src/routes/admin.ts` and verify authorization and response
- [x] 2.5 Add unit tests for auth middleware, self-registration, and admin user management routes in `tests/unit/auth.test.ts` and `tests/unit/admin.test.ts` and verify with `npm run test:unit`

## 3. Frontend Authentication UI and Session State

- [x] 3.1 Create shared user and session types in `packages/core/src/types/auth.ts` and export them from the core package
- [x] 3.2 Implement client-side `useAuth` hook and React Auth Context in `apps/web/src/context/AuthContext.tsx` and verify session status query against `/api/auth/me`
- [x] 3.3 Create `LoginModal` component supporting Google, Microsoft, GitHub and local mock login in `apps/web/src/components/LoginModal.tsx` and verify it renders provider buttons
- [x] 3.4 Update `Header` in `apps/web/src/components/Header.tsx` to render "Inloggen" for guests, and avatar/role badge/logout dropdown for logged-in users with a "Gebruikersbeheer" trigger for admins
- [x] 3.5 Create `AdminUsersModal` in `apps/web/src/components/AdminUsersModal.tsx` for listing users, changing roles (`user`, `planner`, `admin`), toggling active/blocked status, and deleting users

## 4. Integration and End-to-End Testing

- [x] 4.1 Configure Vite dev proxy in `apps/web/vite.config.ts` to route `/api/*` requests to the Worker API at `http://localhost:8787` and verify API calls reach the backend
- [x] 4.2 Write Playwright E2E tests in `tests/e2e/auth.spec.ts` testing guest view, self-registration mock flow, login modal display, profile rendering, and logout flow across desktop and mobile viewports
- [x] 4.3 Write Playwright E2E tests in `tests/e2e/admin.spec.ts` testing administrative user list viewing, role switching, user deactivation/blocking, and account deletion
- [x] 4.4 Run full test suites (`npm run test:unit` and `npm run test:e2e`) and verify all tests pass cleanly
