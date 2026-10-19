# Hiking Companion

Een moderne Progressive Web App (PWA) met twee modi voor langeafstandswandelaars:
* **Hike Planner**: Voorbereiding en route-ontwerp op desktop, tablet of mobiel.
* **Hike Companion**: Live navigatie, GPS-tracking, POI-afstandsberekening en ochtendbriefings in het veld.

---

## Documentatie & Tech Stack

Het complete referentiedocument met alle features, architectuurkeuzes en de gedetailleerde tech stack is te vinden in:
* Markdown: 👉 **[Tech Stack & Master Product Vision (MD)](docs/product-vision-and-techstack.md)**
* PDF: 👉 **[Download / Bekijk Product Vision (PDF)](docs/product-vision-and-techstack.pdf)**

*Dit document wordt continu bijgewerkt tijdens alle fasen van de ontwikkeling. Je kunt de PDF op elk moment opnieuw genereren met:*
```bash
node scripts/export-pdf.mjs
```

---

## Vereiste Software op de Dev Machine

Zorg ervoor dat de volgende software op je ontwikkelmachine is geïnstalleerd voordat je begint:

1. **[Node.js](https://nodejs.org/)**: Versie 20 LTS of hoger.
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Voor het lokaal draaien van de complete applicatiestack via Docker Compose.
3. **[Git](https://git-scm.com/)**: Versiebeheer.

---

## Installatie & Opstarten van het Project

### Stap 1: Repository Klonen en Dependencies Installeren
```bash
git clone <repository-url>
cd HikingCompanion
npm install
```

### Stap 2: Lokale Ontwikkelomgeving Starten

Je kunt het project op twee manieren lokaal draaien:

#### Optie A: Direct via Node.js / Vite
```bash
npm run dev
```
Hiermee start je de lokale PWA frontend en de API development server op.

#### Optie B: Volledig via Docker Compose
```bash
docker compose up -d
```
Hiermee start je alle benodigde containers (PWA frontend, API en lokale services) op de achtergrond.

---

## Testen (Twee Losse Testprojecten)

Het project volgt strikt de principes van **KISS, SOLID en DRY**. Alle ontwikkelingen worden continu getest via twee onafhankelijke testprojecten:

### 1. Unit Tests (Vitest)
Voor het testen van pure algoritmes (GPX parsing, afstandsberekening over tracks, ondergrond-classificatie en data-modellen):
```bash
npm run test:unit
```

### 2. End-to-End Tests (Playwright)
Voor het testen van volledige gebruikersflows op desktop en mobiele viewports (route uittekenen, mode switching, offline caching):
```bash
npm run test:e2e
```
