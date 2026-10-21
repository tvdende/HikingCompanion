## 1. Backend & Configuration

- [ ] 1.1 Configure environment variables in `apps/api/wrangler.toml` for `[env.test.vars]` (`ENVIRONMENT = "test"`, `MOCK_AUTH = "false"`) and `[env.production.vars]` (`ENVIRONMENT = "production"`, `MOCK_AUTH = "false"`), and verify configuration file validity.
- [ ] 1.2 Update `/api/auth/mock-login` endpoint in `apps/api/src/routes/auth.ts` to reject mock login attempts with HTTP 403 Forbidden (`{ error: 'Mock login is only available in development' }`) when running under `test` or `production` environments.
- [ ] 1.3 Add unit tests in `tests/unit/auth.test.ts` verifying that `POST /api/auth/mock-login` returns 403 Forbidden when `ENVIRONMENT` is `test` or `production`, and verify with `npm run test:unit`.

## 2. Frontend UI

- [ ] 2.1 Update `apps/web/src/components/LoginModal.tsx` to guard the divider and `.mock-login-section` behind `import.meta.env.DEV`, ensuring test role buttons are completely excluded on deployed environments.
- [ ] 2.2 Verify monorepo build passes without type or bundle errors via `npm run build`.

## 3. Integration & E2E Verification

- [ ] 3.1 Run full unit test suite (`npm run test:unit`) to ensure all auth, session, and role tests pass.
- [ ] 3.2 Run Playwright E2E test suite (`npm run test:e2e`) to confirm local development workflow and role logins continue to operate properly.
