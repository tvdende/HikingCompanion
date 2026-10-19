## Why

A professional development lifecycle requires automated quality gates and controlled deployment pipelines. Without continuous integration and separated deployment stages, regressions can reach end users undetected. Introducing GitHub Actions CI/CD with dedicated `test` and `production` environments and promotion policies ensures code is automatically validated (unit tests, E2E tests, builds) and deployed to a staging/test environment before being promoted to production.

## What Changes

- **CI Automated Quality Pipeline (`.github/workflows/ci.yml`)**: Triggered on pull requests and pushes, executing linting, TypeScript compilation checks, Vitest unit tests, and Playwright E2E tests.
- **Two-Stage Deployment Pipeline (`.github/workflows/deploy.yml`)**:
  - **Stage 1 (Test / Staging)**: Automatically deployed upon push to the main development branch, deploying the PWA to Cloudflare Pages (test preview) and API to Cloudflare Workers (test environment).
  - **Stage 2 (Production)**: Deployed to production Cloudflare environment only after manual approval gate or release tag promotion, ensuring complete verification on Test first.
- **GitHub Environment Protection & Branch Policies**:
  - Configuration of GitHub Environments (`test` and `production`) with required reviewers/approvers for production.
  - Branch protection policies requiring passing status checks (CI tests) and pull request reviews before merging into `main`.
- **Environment Secrets & Configuration Documentation**: Complete step-by-step documentation for setting up Cloudflare (Account ID, API Tokens with Pages/Workers/D1 scopes, custom domains) and configuring GitHub repository environment secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

## Capabilities

### New Capabilities
- `ci-pipeline`: Automated GitHub Actions workflow executing code verification, unit tests, and Playwright E2E tests on pull requests.
- `deployment-pipeline`: Multi-environment deployment workflow supporting Test and Production stages with approval policies and environment separation.

### Modified Capabilities
<!-- None: Greenfield project -->

## Impact

- Adds `.github/workflows/` directory and workflow definition files.
- Protects repository branches and governs deployment access via GitHub environment secrets and policies.
- Directs release artifacts to Cloudflare Pages and Workers across separated preview and production environments.
