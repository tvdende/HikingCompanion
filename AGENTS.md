# Project Instructions & Agent Guidelines

## Git Workflow & Branch Policy
- **Mandatory Feature Branches**: All new features, changes, enhancements, and OpenSpec implementations MUST be developed on dedicated branches starting with `feat/` (e.g. `feat/my-feature`).
- **No Direct Push to `main`**: Direct commits and pushes to `main` are strictly prohibited.
- **Pull Requests**: Code is merged into `main` only via Pull Requests after passing automated CI tests (`npm run test:unit`, `npm run test:e2e`, and monorepo build).

## Environments & Deployments
- **Test Environment**:
  - URL: `https://hiking-companion-test.pages.dev`
  - Cloudflare Worker: `hiking-companion-api-test`
  - Deployments can be triggered on-demand for any `feat/*` branch via GitHub Actions `workflow_dispatch` (target: `test`).
- **Production Environment**:
  - URL: `https://hiking-companion.pages.dev`
  - Cloudflare Worker: `hiking-companion-api-prod`
  - Production deployments require manual approval or explicit release triggering.
