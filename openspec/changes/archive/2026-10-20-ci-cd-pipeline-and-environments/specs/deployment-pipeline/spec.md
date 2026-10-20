## Purpose

Defines the multi-stage deployment pipeline delivering applications to distinct Test and Production environments on Cloudflare, enforcing promotion gates and environment protection policies.

## ADDED Requirements

### Requirement: Automated Test Environment Deployment
The deployment pipeline SHALL automatically deploy successful changes on the main branch to the Test environment (Cloudflare Pages preview / test worker) to enable verification before production release.

#### Scenario: Deployment to Test environment
- **WHEN** code is merged into the main branch and CI tests have passed
- **THEN** the pipeline deploys the PWA and API to the Test environment and outputs the active Test preview URL

### Requirement: Production Promotion Policy and Approval Gate
The deployment pipeline SHALL require explicit manual review and approval before promoting changes from the Test environment to the Production environment.

#### Scenario: Promotion to production requested
- **WHEN** a release is triggered or promoted to Production
- **THEN** GitHub Actions pauses execution at the Production environment gate until an authorized reviewer approves the deployment

#### Scenario: Approved production release
- **WHEN** an authorized reviewer grants approval on the Production environment deployment
- **THEN** the pipeline deploys the tested build to the Production Cloudflare Pages and Workers environment

### Requirement: Environment Configuration Separation
The deployment pipeline SHALL strictly isolate secrets, environment variables, and database bindings between Test and Production environments.

#### Scenario: Execution in Test environment
- **WHEN** running deployment steps for Test
- **THEN** the pipeline injects test-specific API tokens, preview database bindings, and test environment variables
