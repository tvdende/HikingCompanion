## Why

Currently, mock login with preconfigured test roles (`user`, `planner`, `admin`) is exposed on the deployed Test environment (`https://hiking-companion-test.pages.dev` and `hiking-companion-api-test`), because the API only checks whether `ENVIRONMENT !== 'production'`. Test roles should be exclusive to local development and local automated tests so that the Test environment accurately reflects real-world OAuth authentication flows and prevents bypass of authentication mechanisms.

## What Changes

- **Restrict Mock Authentication API to Development**: Modify `/api/auth/mock-login` in `apps/api` to verify that mock authentication is permitted only when `ENVIRONMENT === 'development'` (or local development with explicit mock auth) and strictly forbidden (HTTP 403) when running under `ENVIRONMENT === 'test'` or `ENVIRONMENT === 'production'`.
- **Environment Variables in Cloudflare Configuration**: Explicitly configure `ENVIRONMENT = "test"` and `MOCK_AUTH = "false"` under `[env.test.vars]`, and `ENVIRONMENT = "production"` and `MOCK_AUTH = "false"` under `[env.production.vars]` in `apps/api/wrangler.toml`.
- **Conditional UI Rendering for Test Roles in Frontend**: Update `apps/web/src/components/LoginModal.tsx` so the "OF VOOR LOKALE ONTWIKKELING" section and test role buttons (`Wandelaar`, `Route Planner`, `Beheerder`) are rendered only in development mode (`import.meta.env.DEV`), completely omitting them from production and test deployment builds.
- **Maintain Test Suite Compatibility**: Ensure unit tests (`tests/unit/auth.test.ts`) and local Playwright E2E tests (`tests/e2e/e2e/auth.spec.ts`) continue to execute and pass in development/test runner modes.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `user-auth`: Introduce a requirement specifying that mock authentication and direct test-role selection are strictly restricted to development environments and forbidden on Test and Production environments.

## Impact

- **Affected Code**:
  - `apps/api/src/routes/auth.ts`: Update mock-login guard logic and error messages.
  - `apps/api/wrangler.toml`: Set `ENVIRONMENT` and `MOCK_AUTH` variables for `[env.test]` and `[env.production]`.
  - `apps/web/src/components/LoginModal.tsx`: Guard test-role login section with `import.meta.env.DEV`.
  - `tests/unit/auth.test.ts`: Add unit test assertions ensuring mock login returns 403 on `ENVIRONMENT === 'test'`.
- **Affected Endpoints**: `POST /api/auth/mock-login` (returns 403 on test environment).
- **Security & User Experience**: Eliminates test-role buttons on the public test environment, requiring testers to use real OAuth login providers while preserving developer velocity locally.
