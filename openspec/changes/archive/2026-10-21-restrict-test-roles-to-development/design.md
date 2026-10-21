## Context

See `proposal.md` for motivation and background. Currently, the API endpoint `POST /api/auth/mock-login` allows logins when `c.env?.ENVIRONMENT !== 'production'`, and the frontend `LoginModal.tsx` renders the mock role section without checking the application build mode. As a result, the deployed test environment allows test role logins, bypassing standard OAuth flows.

## Goals / Non-Goals

**Goals:**
- Restrict mock authentication strictly to local development and local test executions.
- Disallow `POST /api/auth/mock-login` with HTTP 403 Forbidden whenever running under `ENVIRONMENT === 'test'` or `ENVIRONMENT === 'production'`.
- Define explicit Cloudflare Worker environment variables in `wrangler.toml` for `test` and `production` targets.
- Hide and omit the test role login buttons from frontend builds deployed to Test and Production.
- Ensure all existing unit tests and Playwright E2E tests continue to pass in local development.

**Non-Goals:**
- Altering the OAuth registration, authentication, or session management flows.
- Modifying role-based permissions (`admin`, `planner`, `user`).
- Adding dynamic API calls to query mock availability on every modal render.

## Decisions

### Decision 1: API Environment Guard (Fail-Closed)
In `apps/api/src/routes/auth.ts`:
- Check:
  ```ts
  const isForbiddenEnv = c.env?.ENVIRONMENT === 'test' || c.env?.ENVIRONMENT === 'production';
  const isMockAllowed = !isForbiddenEnv && (c.env?.MOCK_AUTH === 'true' || c.env?.ENVIRONMENT === 'development' || !c.env?.ENVIRONMENT);
  ```
- If `!isMockAllowed`, respond with HTTP 403:
  ```json
  { "error": "Mock login is only available in development" }
  ```
- *Rationale*: Failing closed against known deployed environments (`test` and `production`) guarantees that deployed instances can never run mock logins even if environment variables are partially misconfigured.
- *Alternatives considered*: Only checking `MOCK_AUTH === 'true'`. Rejected because if an environment variable is omitted in Cloudflare, having explicit guardrails on `ENVIRONMENT` ensures defense in depth.

### Decision 2: Explicit Wrangler Environment Variables
In `apps/api/wrangler.toml`:
- Add `[env.test.vars]` with `ENVIRONMENT = "test"` and `MOCK_AUTH = "false"`.
- Add `[env.production.vars]` with `ENVIRONMENT = "production"` and `MOCK_AUTH = "false"`.
- *Rationale*: Explicitly declarative in source control; applied automatically during CI/CD wrangler deployment (`wrangler deploy --env test` / `wrangler deploy --env production`).

### Decision 3: Frontend Conditional Rendering via `import.meta.env.DEV`
In `apps/web/src/components/LoginModal.tsx`:
- Render the divider and `.mock-login-section` conditionally:
  ```tsx
  {import.meta.env.DEV && (
    <>
      <div className="modal-divider">
        <span>OF VOOR LOKALE ONTWIKKELING</span>
      </div>
      <div className="mock-login-section">
        ...
      </div>
    </>
  )}
  ```
- *Rationale*: Vite evaluates `import.meta.env.DEV` at build time. During `npm run dev` (local dev & Playwright e2e), it evaluates to `true`. During `npm run build` (Cloudflare Pages deployment for test and production), it evaluates to `false` and dead-code elimination removes the block from the bundle.
- *Alternatives considered*: Dynamic endpoint query `/api/auth/config`. Rejected as unnecessary overhead for a static build environment property.

## Risks / Trade-offs

- **[Risk] Test environment users cannot use mock accounts** → *Mitigation*: Test environment testers must authenticate with standard OAuth providers (Google, Microsoft, GitHub). Once logged in, administrators can manage roles via the Admin panel if higher privileges (`planner`/`admin`) are needed.
- **[Risk] Automated tests broken by environment check** → *Mitigation*: Local E2E tests use `npm run dev` where `import.meta.env.DEV` is `true`. Unit tests in `tests/unit/auth.test.ts` supply mock env bindings directly, and we add an explicit unit test verifying 403 behavior on `ENVIRONMENT: 'test'`.
