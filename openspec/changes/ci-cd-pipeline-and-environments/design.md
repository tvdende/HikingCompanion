## Context

The repository is configured as an npm monorepo with `apps/web` (Vite PWA), `apps/api` (Cloudflare Workers), `packages/core`, `tests/unit` (Vitest), and `tests/e2e` (Playwright). Cloudflare is the hosting provider (Pages for PWA frontend, Workers for API). See `proposal.md` for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Provide a robust GitHub Actions CI workflow (`.github/workflows/ci.yml`) validating all code changes on pull requests.
- Provide a two-stage deployment workflow (`.github/workflows/deploy.yml`) with isolated `test` and `production` environments.
- Enforce release policies where changes are deployed and verified on `test` first before promotion to `production`.
- Integrate GitHub Environments with environment protection rules (reviewer approvals for production).
- Document required repository secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and branch protection rules.

**Non-Goals:**
- Managing third-party paid CI/CD platforms (e.g. CircleCI, Travis).
- Deploying to multi-cloud providers outside the Cloudflare ecosystem.

## Decisions

### 1. Workflow Architecture: GitHub Actions with Cloudflare Actions
- **Choice**: Native GitHub Actions using `cloudflare/wrangler-action` and standard Node.js setup actions.
- **Rationale**: Zero external cost, native repository integration, and supported directly by Cloudflare.
- **Structure**:
  - `ci.yml`: Runs on pull requests and pushes to `main`. Executes `npm run test:unit`, `npm run build`, and `npm run test:e2e`.
  - `deploy.yml`: Contains two sequential deployment jobs: `deploy-test` and `deploy-production`.

### 2. Environment Promotion Strategy & Policy
- **Choice**: GitHub Environments (`test` and `production`) with environment protection rules.
- **Workflow Flow**:
  1. Pull Request created → `ci.yml` runs unit tests, E2E tests, and build checks.
  2. Pull Request merged to `main` → `deploy-test` job automatically builds and deploys to Cloudflare Pages (Test preview) and Cloudflare Workers (test environment).
  3. Verification phase → Developers/testers review the live changes on the Test environment URL.
  4. Production Promotion → The `deploy-production` job targets the `production` GitHub Environment. GitHub Environment protection halts execution until an authorized reviewer approves the deployment (or when a release tag `v*.*.*` is published).
- **Alternatives considered**: Separate `develop` and `main` branches (rejected in favor of trunk-based development with environment gates, which is simpler and prevents merge conflicts).

### 3. Caching and Performance
- **Choice**: `actions/setup-node` caching for npm dependencies, and caching Playwright browser binaries in `~/.cache/ms-playwright`.
- **Rationale**: Keeps CI pipeline runtimes under 2-3 minutes, providing rapid feedback.

### 4. Secrets Management
- **Choice**: GitHub Environment Secrets:
  - `CLOUDFLARE_API_TOKEN`: Scoped API token with permissions for Cloudflare Pages and Workers.
  - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account identifier.
  - Configured per environment in GitHub Repository Settings → Environments (`test` vs `production`).

### 5. Cloudflare Provisioning & Setup Guide
- **Choice**: Dedicated, detailed Markdown guide in `docs/cloudflare-setup-guide.md`.
- **Contents**:
  - Locating Cloudflare Account ID from the Cloudflare Dashboard.
  - Creating a Custom Cloudflare API Token with specific minimum required permissions (Account: `Cloudflare Pages:Edit`, `Workers Scripts:Edit`, `D1:Edit`, `Workers KV Storage:Edit`; User: `Memberships:Read`).
  - Creating Cloudflare Pages projects for Test and Production.
  - Configuring Worker service names and D1 database bindings for Test and Production.
  - Configuring DNS records and custom subdomains (e.g. `test.hikecompanion.nl` and `hikecompanion.nl`).

## Risks / Trade-offs

- **[Risk] Missing or invalid Cloudflare API secrets causing pipeline failure**  
  → **Mitigation**: Add a validation step in `deploy.yml` that checks secret presence with helpful diagnostic messages before attempting deployment, and provide complete instructions in `docs/cloudflare-setup-guide.md` and `docs/deployment-and-environments.md`.
- **[Risk] Flaky Playwright E2E tests in headless runners**  
  → **Mitigation**: Ensure Playwright configuration includes `retries: process.env.CI ? 2 : 0` and uploads trace and video artifacts on failure for debugging.
