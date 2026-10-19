# Hiking Companion - Master Product Vision & Technical Specification

Dit document dient als het centrale en levende referentiekader voor het Hiking Companion project. Hierin worden alle features, architectuurkeuzes, datastructuren en de tech stack bijgehouden en bijgewerkt tijdens ontwikkelingen.

---

## 1. Doel & Visie

De **Hiking Companion** is een moderne, mobielvriendelijke Progressive Web App (PWA) met een centrale backend API, specifiek ontworpen voor langeafstandswandelaars en meerdaagse trektochten (zoals het Pieterpad, GR-routes of bergtochten).

De applicatie combineert twee complementaire modi binnen één uniforme PWA:
1. **Hike Planner (Desktop / Web / Tablet / Mobiel)**: De voorbereidingsmodus. Uitgebreide tools om lange routes te ontwerpen, GPX-bestanden te bewerken en te snappen aan paden, ondergrond te analyseren, etappes in te delen en logistiek (supermarkten, overnachtingen) te plannen.
2. **Hike Companion (Mobiel / Onderweg in het Veld)**: De wandelmodus. Een afleidingsvrije, robuuste interface voor onderweg met live GPS-tracking, offline kaartweergave, afstandsberekening over de route naar POI's, en dagelijkse ochtendbriefings.

---

## 2. Architectuur- en Ontwerpprincipes

* **KISS (Keep It Simple, Stupid)**: Geen onnodige abstractielagen, microservices of ingewikkelde cloud-infrastructuur. Eén centrale monorepo met een duidelijke taakverdeling.
* **SOLID**: 
  * *Single Responsibility*: Gespecialiseerde modules voor GPX-parsing, routing-interactie, POI-caching en navigatie.
  * *Open/Closed & Dependency Inversion*: Kern-algoritmes (bijv. afstandsberekening, OSM data-extractie) zijn pure TypeScript-functies in `packages/core`, onafhankelijk van UI-componenten of database-drivers.
* **DRY (Don't Repeat Yourself)**: Gedeelde types en businesslogica worden gedeeld tussen de PWA en de API via de `core`-module.
* **Twee Onafhankelijke Testprojecten**:
  * `tests/unit`: Snelle unit tests (Vitest) voor wiskundige berekeningen, parsers en datavalidaties.
  * `tests/e2e`: End-to-end browser- en mobiele viewport-testen (Playwright).

---

## 3. Tech Stack & Infrastructuur

Alle technologieën zijn gekozen op basis van **bewezen volwassenheid, actieve community en geschiktheid voor gratis/kostenefficiënte hosting**.

```
+-------------------------------------------------------------------------+
|                               MONOREPO                                  |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  | apps/web (PWA)     |  | apps/api (Backend) |  | packages/core      | |
|  | React 19 + Vite    |  | Cloudflare Workers |  | Types, GPX engine, | |
|  | MapLibre GL JS     |  | Hono Framework     |  | Afstand & Surface  | |
|  +--------------------+  +--------------------+  +--------------------+ |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  | tests/unit         |  | tests/e2e          |  | docs/              | |
|  | Vitest             |  | Playwright         |  | Techstack & specs  | |
|  +--------------------+  +--------------------+  +--------------------+ |
+-------------------------------------------------------------------------+
```

### 3.1 Frontend (PWA)
* **Framework**: React 19 met TypeScript en Vite (maximale stabiliteit, groot ecosysteem).
* **PWA & Offline**: `vite-plugin-pwa` (aangedreven door Google Workbox) voor het offline cachen van de app-shell en kaarttegels.
* **Kaartmotor**: **MapLibre GL JS** (open-source vector engine onder de Linux Foundation, ondersteund door AWS, Meta en Microsoft).

### 3.2 Backend & API
* **Runtime**: **Cloudflare Workers** (draait op de V8 Edge-runtime met wereldwijde dekking en 0 ms opstarttijd).
* **API Framework**: **Hono** (de officiële industriestandaard voor edge APIs, typesafe en razendsnel).

### 3.3 Database & Backups
* **Database**: **Cloudflare D1 (SQLite)**.
* **ORM**: **Drizzle ORM** (typesafe SQL, geen runtime overhead, duidelijke migraties).
* **Backup Strategie**: Omdat D1 SQLite is, is een backup maken net zo simpel als:
  ```bash
  npx wrangler d1 export hiking-db --output=./backups/backup.sql
  ```
  Daarnaast biedt Cloudflare automatische point-in-time herstelpunten.

### 3.4 Hosting & Docker
* **Productie**: Cloudflare Pages (Frontend) + Cloudflare Workers & D1 (Backend) -> **100% gratis tier**.
* **Lokaal & Self-hosting**: Volledige **Docker Compose** configuratie zodat ontwikkelaars met `docker compose up` direct de hele stack kunnen draaien.
* **Cloudflare Tunnel (`cloudflared`)**: Mogelijkheid om een lokale Docker Compose setup via een veilige uitgaande tunnel direct en gratis op een eigen domein te ontsluiten (zonder routerpoorten te openen).

### 3.5 Betalingen & Betaalprovider
* **Betaalprovider**: **Mollie** (officiële Node/TypeScript SDK & Webhooks in Cloudflare Workers).
  * Ondersteunt iDEAL, Bancontact, Creditcard, Apple Pay.
  * Eenmalige betalingen voor marketplace-routes.
  * Terugkerende betalingen / subscriptions voor Premium abonnementen via Mollie Mandates/Subscriptions API.

### 3.6 Push Notificaties
* **Technologie**: **W3C Web Push API & VAPID** (RFC 8292).
* **Kosten**: **100% Gratis**. Gebruikt de ingebouwde browser push-gateways (Apple APNs, Google FCM, Mozilla autopush) zonder betaalde tussenpartijen of bots.
* **Integratie**: Service Worker in de PWA + Cloudflare Workers Web Push payload signing.

---

## 4. Gedetailleerde Feature Matrix

### 4.1 Rollen & Toegangsbeheer (RBAC)
* **Beheerder (Admin)**:
  * Volledig beheer over gebruikers, rollen en permissies.
  * Beheren van globale platforminstellingen en configureerbare limieten (bijv. max aantal kilometers en max aantal shares voor gratis gebruikers).
  * Inzicht in transacties, uitbetalingen aan planners en route-moderatie.
* **Planner**:
  * Speciale makersrol voor ervaren wandelaars en route-ontwerpers.
  * Creëert en cureert complete routes en meerdaagse trektochten voor de gemeenschap (inclusief campings, overnachtingen, etappes, POI's en reisinformatie).
  * Kan geverifieerde routes aanbieden voor verkoop op het platform met een eigen prijskaartje.
* **Eindgebruiker (Standaard / Gratis)**:
  * Kan zelf routes plannen en navigeren in de app.
  * **Configureerbare limieten**:
    * Maximaal aantal kilometers per geplande route (bijv. max 50 km).
    * Maximaal aantal personen waarmee een route gedeeld kan worden (bijv. max 3 personen).
  * *Uitzondering*: De limieten vervallen automatisch zodra de gebruiker een **Premium abonnement** afsluit óf wanneer de gebruiker een specifieke route heeft **gekocht** van een planner.
* **Eindgebruiker (Premium)**:
  * Onbeperkt aantal kilometers per geplande route.
  * Onbeperkt routes delen met wandelpartners en vrienden.
  * Volledige toegang tot alle geavanceerde features (onbeperkte offline kaarten, uitgebreide weerbriefings).

### 4.2 Gebruikersbeheer & Authenticatie
* **OAuth Login**:
  * Inloggen via **Google**
  * Inloggen via **Microsoft**
  * Inloggen via **GitHub**
* **Sessiebeheer**: Veilige, HTTP-only cookie sessies of JWT tokens via de API.
* **Gebruikersprofiel**: Opgeslagen routes, gekochte routes, favoriete POI's en abonnementsstatus.

### 4.3 Route Planning & Kaartbewerking (Hike Planner)
* **GPX Import & Export**: Bestaande wandelroutes (GPX/KML) inladen en opslaan.
* **Interactieve Route-editor**:
  * Puntsgewijs routes uittekenen op de kaart.
  * **Snap to Roads / Trails**: Automatisch snappen naar officiële wandelpaden, bospaden en wegen via OpenStreetMap data.
* **Ondergrond-analyse (Surface Breakdown)**:
  * Analyseert de route aan de hand van OSM-tags (`surface`, `tracktype`, `highway`).
  * Realtime overzicht in kilometers en percentages:
    * *Onverhard / Bospad / Zandpad* (bijv. 14,2 km - 65%)
    * *Grind / Halfverhard* (bijv. 4,1 km - 19%)
    * *Asfalt / Verhard* (bijv. 3,5 km - 16%)
* **Etappes & Knooppuntenbeheer**:
  * Lange routes automatisch of handmatig opsplitsen in losse dagetappes.
  * GPX-tracks interpreteren als knooppuntennetwerk zodat verschillende etappes eenvoudig aan elkaar geknoopt kunnen worden.

### 4.4 POI Detectie & Intelligentie (Points of Interest)
* **Corridor Scanning**: Zoeken naar voorzieningen binnen een instelbare straal langs de actieve route via de OpenStreetMap / Overpass API.
* **POI Categorieën**:
  * **Supermarkten & Levensmiddelen**: Inclusief het uitlezen en weergeven van actuele **openingstijden** (bijv. *"Open tot 20:00"* of waarschuwing bij zondagssluiting).
  * **Campings & Bivakzones**
  * **Hostels & Jeugdherbergen**
  * **Hotels, B&B's & Pensions**
* **Slimme Filtering & Favorieten**:
  * Eenvoudig categorieën tonen of verbergen op de kaart.
  * **Favoriet-pinning**: Belangrijke POI's markeren als favoriet. Favorieten blijven altijd zichtbaar op de kaart, zelfs als de categorie verborgen is.
* **Afstand-over-de-route Calculatie**:
  * Berekent de exacte wandelafstand *langs de route* vanaf de huidige positie tot de afslag naar de POI (geen misleidende hemelsbrede afstand).
* **Lokale Database Caching**: Opgehaalde POI's worden opgeslagen in de Cloudflare D1 database om externe API rate limits te voorkomen en snelle laadtijden te garanderen.

### 4.5 Live Navigatie & Veldgebruik (Hike Companion)
* **GPS Positie & Oriëntatie**: Live weergave van de wandelaar op de kaart met kompasrichting.
* **Companion Focus View**: Vereenvoudigde mobiele weergave met grote, met handschoenen bedienbare knoppen, batterijbesparing en Screen Wake Lock (scherm blijft aan tijdens wandelen).
* **Volledige Offline Werking**: Kaarten van de actieve regio, de route en de POI's worden lokaal gecachet in de browser (IndexedDB / Cache API) zodat de app 100% blijft werken als het mobiele bereik wegvalt.

### 4.6 Marketplace, Routes Kopen & Mollie Integratie
* **Routes Kopen via Mollie**:
  * Planners kunnen hun geverifieerde routes (inclusief campings, POI-notities en etappes) te koop aanbieden op de marketplace.
  * Eindgebruikers kunnen routes direct afrekenen via **Mollie** (iDEAL, Bancontact, creditcard, etc.).
  * Na succesvolle betaling (afgehandeld via Mollie webhooks) wordt de route permanent ontgrendeld in het account van de koper, zonder de afstands- of sharebeperkingen van het gratis account.
* **Premium Abonnementen via Mollie**:
  * Maandelijkse of jaarlijkse abonnementen worden via Mollie Subscriptions / Recurring betalingen afgehandeld.
  * Automatische activatie en verlenging van de Premium status.
* **Sociaal & Delen**:
  * Routes delen met vrienden via unieke deellinks (gebonden aan de sharelimiet van de gebruiker of onbeperkt voor Premium/aankopen).
  * Gezamenlijk wandelen: vrienden kunnen elkaars etappes en geselecteerde overnachtingsplekken inzien.

### 4.7 Dagelijkse Ochtend-Briefing (Native PWA Web Push)
* **100% Gratis Native Web Push (VAPID)**:
  * De PWA maakt gebruik van de officiële W3C **Web Push & Notification API** via de Service Worker.
  * **Volledig gratis**: De push-infrastructuur (Apple APNs voor iOS, Google FCM voor Android, Mozilla Push voor Firefox) is kosteloos inbegrepen bij de browser; er is géén externe betaalde service (zoals OneSignal, Twilio of Signal bots) nodig.
  * Werkt naadloos op zowel Android als iOS (vanaf iOS 16.4 geïnstalleerd op beginscherm) en Desktop.
  * De gebruiker geeft met één klik toestemming ("Toestaan") in de app.
* **Geautomatiseerde Verzending**:
  * Iedere ochtend op een instelbaar tijdstip (bijv. 07:00 uur) verstuurt de backend (Cloudflare Worker Cron Trigger) de briefing direct naar het apparaat van de wandelaar.
* **Inhoud van de Notificatie & Briefing**:
  * **Notificatie preview**: *"Goedemorgen! Vandaag etappe 3 (18,4 km). ⛅ 19°C, droog. Tik om je route te openen."*
  * **Tik-actie**: Opent direct de PWA in Companion Modus op de actieve etappe van die dag.
  * **Gedetailleerde dagbriefing**:
    * Etappe-overzicht en totaal te lopen afstand van die dag.
    * Ondergrondverdeling voor die specifieke etappe (bijv. 80% bospad/onverhard, 20% verhard).
    * Actuele weersvoorspelling per tijdsblok langs de route (temperatuur, neerslagkans, windkracht en richting via de gratis Open-Meteo API).

---

## 5. Teststrategie & Kwaliteitsborging

1. **Unit Test Project (`tests/unit` - Vitest)**:
   * GPX parser validatie (importeren van diverse GPX-versies).
   * Algoritme voor afstand-over-de-track berekening.
   * Classificatie van OSM-tags naar ondergrond-categorieën (asfalt vs onverhard).
   * Parseren van OpenStreetMap `opening_hours` strings naar menselijk leesbare statussen.
2. **E2E Test Project (`tests/e2e` - Playwright)**:
   * Desktop tests: Uploaden van een GPX, route bewerken, POI filters toggelen.
   * Mobile tests: Emulatie van iPhone en Android schermen; controleren of de Companion modus optimaal functioneert.
   * Offline simulatie: Verbinding uitschakelen in Playwright en controleren of de kaart en route blijven werken.

---

## 6. Lokale Installatie & Ontwikkeling

### Vereiste Software op de Dev Machine:
* **Node.js**: v20 LTS of hoger.
* **Docker & Docker Compose**: Voor lokaal container-draaien.
* **Git**

### Opstarten van het Project:
```bash
# 1. Repository klonen & dependencies installeren
npm install

# 2. Lokale ontwikkelserver starten (PWA + API)
npm run dev

# OF via Docker Compose:
docker compose up -d

# 3. Tests draaien
npm run test:unit       # Draait de Vitest unit tests
npm run test:e2e        # Draait de Playwright E2E tests
```
