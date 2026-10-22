# Project Instructions & Agent Guidelines

## Git Workflow & Branch Policy
- **Mandatory Feature Branches**: All new features, changes, enhancements, and OpenSpec implementations MUST be developed on dedicated branches starting with `feat/` (e.g. `feat/my-feature`).
- **No Direct Push to `main`**: Direct commits and pushes to `main` are strictly prohibited.
- **Pull Requests**: Code is merged into `main` only via Pull Requests after passing automated CI tests (`npm run test:unit` and monorepo build). E2E tests (`npm run test:e2e`) are run locally.

## Environments & Deployments
- **Test Environment**:
  - URL: `https://hiking-companion-test.pages.dev`
  - Cloudflare Worker: `hiking-companion-api-test`
  - Deployments can be triggered on-demand for any `feat/*` branch via GitHub Actions `workflow_dispatch` (target: `test`).
- **Production Environment**:
  - URL: `https://hiking-companion.pages.dev`
  - Cloudflare Worker: `hiking-companion-api-prod`
  - Production deployments require manual approval or explicit release triggering.

## Documentatie Richtlijnen (Documentation Maintenance Policy)
- **Altijd up-to-date documentatie**: Bij de introductie van nieuwe functionaliteiten, architectuurwijzigingen, libraries of datastructuren MOET de documentatie in `/docs` direct worden bijgewerkt of uitgebreid. Documentatie mag nooit achterlopen op de actuele code.
- **Actieve documentatie-audits**: Controleer bij iedere wijziging of bestaande documenten (zoals `docs/product-vision-and-techstack.md`, `docs/deployment-and-environments.md`, `docs/i18n-localization.md`, etc.) nog synchroon lopen met de actuele implementatie. Werk verouderde secties onmiddellijk bij.

## Internationalisatie & Vertalingen Policy (i18n & Translation Standards)
- **Hergebruik van bestaande vertalingen**: Controleer bij nieuwe functionaliteiten altijd eerst of er al bestaande vertaalsleutels in `apps/web/src/i18n/locales/nl.ts` en `en.ts` aanwezig zijn die hergebruikt kunnen worden voordat nieuwe sleutels worden bedacht.
- **Nieuwe vertaalsleutels toevoegen met 100% pariteit**: Als een vertaling nog niet bestaat, voeg de nieuwe sleutel direct toe aan zowel `nl.ts` (Nederlands, de leidende standaardtaal) als `en.ts` (Engels). Beide bestanden moeten te allen tijde 100% sleutel-pariteit behouden.
- **Zero Untranslated Strings op aangeraakte pagina's**:
  - Bij ELKE component of pagina die wordt aangeraakt of bewerkt, MOET actief gezocht worden naar hardcoded, niet-vertaalde gebruikersgerichte teksten.
  - Alle gevonden hardcoded teksten moeten onmiddellijk vervangen worden door `t(...)` en opgenomen worden in `nl.ts` en `en.ts`.
  - Geen enkele aangeraakte pagina mag na een wijziging nog hardcoded of onvertaalde teksten bevatten.
