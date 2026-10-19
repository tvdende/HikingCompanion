## 1. CI Quality Pipeline

- [x] 1.1 Create `.github/workflows/ci.yml` configuring Node.js setup, dependency installation with caching, and build verification across all monorepo workspaces, verifying valid workflow syntax.
- [x] 1.2 Add the automated unit test execution step to `ci.yml` invoking `npm run test:unit`, ensuring job failure on any test regression.
- [x] 1.3 Add the Playwright E2E test step to `ci.yml` with browser caching and headless execution via `npm run test:e2e`, uploading test failure artifacts.

## 2. Multi-Stage Deployment Pipeline

- [x] 2.1 Create `.github/workflows/deploy.yml` defining the `deploy-test` job triggered on pushes to `main`, deploying `apps/web` to Cloudflare Pages (Test preview) and `apps/api` to Cloudflare Workers (Test environment).
- [x] 2.2 Add the `deploy-production` job in `deploy.yml` conditioned on the success of `deploy-test` and bound to the `production` GitHub Environment.
- [x] 2.3 Configure environment-specific secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and environment variables across the deployment jobs.

## 3. Environment Protection & Release Policies

- [x] 3.1 Create `docs/cloudflare-setup-guide.md` providing step-by-step instructions for configuring Cloudflare (finding Account ID, creating scoped API tokens for Pages/Workers/D1, creating Pages projects, and setting up custom domains).
- [x] 3.2 Create `docs/deployment-and-environments.md` with step-by-step instructions for configuring GitHub Environments (`test` and `production`), repository secrets, and reviewer approval protection rules.
- [x] 3.3 Document branch protection policies for `main` requiring passing CI checks and PR approvals before merge, preventing unverified code from reaching Test.
- [x] 3.4 Validate all GitHub Action YAML workflow files for syntax, permissions, and trigger correctness.
