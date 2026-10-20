# Git Workflow & Branch Policy

## 1. Branching Strategy: Feature Branches
- **Mandatory Feature Branches**: All new features, capabilities, user stories, and OpenSpec changes MUST be developed on dedicated branches starting with `feat/`.
  - Format: `feat/<kebab-case-name>` (e.g., `feat/offline-routing`, `feat/elevation-profile`, `feat/auth-improvements`).
- **Bugfixes & Maintenance**: Bug fixes and hotfixes must use the `fix/` prefix (e.g., `fix/sqlite-session-leak`).
- **Zero Direct Work on `main`**: Never commit or implement features directly on the `main` branch. Always create or switch to a `feat/` branch before making changes.

## 2. Main Branch Protection & Pull Requests
- The `main` branch is protected and represents production-ready code.
- Direct pushes (`git push origin main`) are strictly forbidden.
- All code must enter `main` exclusively through Pull Requests (PRs).
- Before merging a PR:
  - CI Quality Pipeline (`ci.yml`) must run and pass all monorepo builds, unit tests, and E2E Playwright suites.
  - Changes should be reviewed and verified on the `test` environment where appropriate.

## 3. Deployment Flow & Environments
- **Test Environment**:
  - Cloudflare Pages: `hiking-companion-test` (`https://hiking-companion-test.pages.dev`)
  - Cloudflare Worker: `hiking-companion-api-test`
  - Cloudflare D1: `hiking-companion-db-test`
- **Deploying Features to Test**:
  - Any `feat/*` branch can be deployed to the `test` environment on-demand using GitHub Actions (`Multi-Stage Deployment Pipeline` -> Run workflow -> select `feat/*` branch -> target: `test`).
  - Merging a PR into `main` automatically deploys to `test`.
- **Production Environment**:
  - Cloudflare Pages: `hiking-companion` (`https://hiking-companion.pages.dev`)
  - Cloudflare Worker: `hiking-companion-api-prod`
  - Cloudflare D1: `hiking-companion-db-prod`
  - Deployments to `production` are gated and must never be triggered blindly from unfinished feature branches.
