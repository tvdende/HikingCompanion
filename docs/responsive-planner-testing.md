# Responsive Planner Testen

Dit document beschrijft hoe de Route Planner met Playwright wordt getest op vier apparaatcategorieën, welke layoutregels de tests afdwingen en hoe de planner-layout zich aanpast aan de schermgrootte.

## Apparaatcategorieën

De planner-suite (`tests/e2e/e2e/planner-responsive/`) draait in vier Playwright-projecten, gedefinieerd in `tests/e2e/playwright.config.ts`:

| Project | Categorie | Apparaat / viewport | Engine | Invoer | Layout-tier |
|---|---|---|---|---|---|
| `planner-mobile` | mobile | Pixel 7, 360×800 | Chromium | touch (`pointer: coarse`) | compact |
| `planner-tablet` | tablet | iPad (gen 7), 820×1180 | WebKit | touch (`pointer: coarse`) | medium |
| `planner-laptop` | laptop | 1366×768 | Chromium | muis | wide |
| `planner-desktop` | desktop | 1920×1080 | Chromium | muis | wide |

Elk project draait alleen `planner-responsive/**/*.spec.ts`. De bestaande projecten (`chromium-desktop`, `mobile-iphone`, `mobile-pixel`) negeren deze map. De categorie is in tests beschikbaar via de `category`-fixture; `isTouch` is `true` voor mobile en tablet.

## Layout-tiers

De app kent drie layout-tiers, geleverd door de hook `useLayoutTier()` in `apps/web/src/hooks/useLayoutTier.ts`. De hook gebruikt `matchMedia` en zet `data-layout-tier` op `.main-viewport`. De CSS-breakpoints in `apps/web/src/index.css` gebruiken dezelfde waarden.

| Tier | Breedte | Plannerpaneel | Toolbar |
|---|---|---|---|
| compact | < 768px | Bottom sheet van 40% van de schermhoogte. De knop `#planner-sheet-toggle` vergroot het paneel naar 85% en verkleint het weer. In uitgeklapte stand zijn toolbar, kaartknoppen en locatieknop verborgen. | Volle breedte tussen de linkerrand en de kaartknoppen; loopt door over meerdere regels; alleen iconen |
| medium | 768–1199px | Zijbalk van `max(320px, min(opgeslagen breedte, 45vw))`. De opgeslagen breedte wordt niet overschreven. | Naast de zijbalk; loopt door over meerdere regels; alleen iconen |
| wide | ≥ 1200px | Zijbalk met de opgeslagen breedte (340–680px) | Naast de zijbalk; loopt door over meerdere regels; knoppen met labels |

Overige layoutregels:

- **Compacte header:** merktitel, gebruikersnaam, rolbadge en modus-labels zijn verborgen. De rolbadge staat in plaats daarvan in het profielmenu.
- **Touch-apparaten** (`@media (pointer: coarse)`): elke planner-bediening is minimaal 44×44 CSS-pixels, inclusief de MapLibre zoom- en kompasknoppen.
- **Toasts:**
  - Op bredere schermen verschijnen ze onder de header en de kaartnavigatie.
  - Op compacte schermen in de planner verschijnen ze boven de bottom sheet, links van de locatieknop.
  - De timer voor automatisch sluiten pauzeert zolang de muis boven een toast hangt of de toast focus heeft.
- **Dialogen:** maximaal `100dvh - 2rem` hoog, met scrollende inhoud. De actieknoppen (`.modal-actions` / `.modal-footer`) blijven onderaan zichtbaar.
- **Overlays:** de bevestigingsdialoog wordt via een portal in `document.body` gerenderd, zodat ouders met `backdrop-filter` hem niet kunnen afknippen. Kaartpopups liggen boven de toolbar en de bottom sheet.

## Layout-assertions

De helpers in `planner-responsive/layout.ts` controleren elke plannerstatus:

| Helper | Controleert |
|---|---|
| `expectNoHorizontalScroll` | Document, app-shell, header, `.main-viewport` en `#planner-panel` scrollen nooit horizontaal en er wordt geen header-element afgeknipt. Bij falen wordt het overlopende element gemeld. |
| `expectReachable` | Het element ligt binnen de viewport na scrollen van de eigen scrollcontainer. |
| `expectNotCovered` | Niets bedekt het midden van het element. |
| `expectTouchTarget` | Het element is minimaal 44×44 CSS-pixels. Alleen voor touch-categorieën. |
| `expectUsable` | Combineert bereikbaar, niet bedekt en (op touch) touch-target. |
| `expectNoOverlap` | Twee elementen (bijvoorbeeld toolbar en paneel) overlappen niet. |
| `expectMapArea` | Minimaal 40% van de viewporthoogte en -breedte blijft vrij kaartoppervlak. |
| `expectDialogFits` | De dialoog past in de viewport en de acties zijn bruikbaar. |
| `auditVisibleControls` | Controleert elke zichtbare interactieve bediening in header, paneel, toolbar, kaartknoppen, popups, locatieknop en toasts. Bij een open dialoog wordt alleen de bovenste dialoog gecontroleerd. |

De audit kent een paar bewuste uitzonderingen:
- Kaartmarkers en route-handles zijn vrijgesteld van de 44px-regel.
- Uitgeschakelde bedieningselementen worden getest alsof ze actief zijn.
- Een open profielmenu of kaartpopup mag andere bediening bedekken.

## Testfixtures

`planner-responsive/fixtures.ts` maakt de suite deterministisch:
- Logt in als planner en levert een in-memory `/api/routes` CRUD, gevuld met een conceptroute en een definitieve route.
- Routering en ondergrondanalyse geven vaste antwoorden.
- Animaties gebruiken reduced motion.
- OpenStreetMap-tegels worden vervangen door een lokale stub-tegel (`tests/e2e/fixtures/map-tile.png`). Zet `PLANNER_REAL_TILES=1` om de echte tegels te laden, bijvoorbeeld voor screenshots met een realistische kaart.

## Geteste plannerfuncties

| Spec | Functies |
|---|---|
| `session-shell.spec.ts` | Header, profielmenu, uit- en inloggen, Planner/Companion-wissel, NL/EN-wissel, bottom sheet-toggle (mobile) |
| `map-controls.spec.ts` | Zoom, kompas, locatie en centreren op route |
| `route-drawing.spec.ts` | Nieuwe route, toolbar, waypoints toevoegen, invoegen, slepen en verwijderen, waypoint-popup, snap/direct, ongedaan maken/opnieuw, omkeren, wissen |
| `stages.spec.ts` | Etappes toevoegen, selecteren, hernoemen, notities, vervoerstype, herordenen, samenvoegen (paneel en kaartpopup), verwijderen, volledige-routeweergave |
| `summary-surface.spec.ts` | Routestatistieken, status, route sluiten, ondergrondanalyse, kaartlaag-toggle |
| `gpx.spec.ts` | GPX-import (knop en bestandsinvoer), toevoegen, dialogen voor meerdere bestanden, meerdere tracks en toevoegkeuze, foutbanner, export |
| `save-library.spec.ts` | Opslaandialoog, bibliotheek zoeken en filteren, laden, exporteren, metadata bewerken, verwijderen |
| `feedback.spec.ts` | Succes- en fouttoasts, bevestigingsdialoog met focusherstel |
| `planner-journey.spec.ts` | De volledige flow, met documentatiescreenshots |

## Screenshots

`planner-journey.spec.ts` maakt per categorie 14 documentatiescreenshots met `captureStep` (`planner-responsive/screenshots.ts`):

```
tests/e2e/screenshots/planner/
├── mobile/   01-planner-empty.png … 14-planner-english.png
├── tablet/
├── laptop/
└── desktop/
```

De 14 stappen zijn:
1. `01-planner-empty`
2. `02-editing-toolbar`
3. `03-route-drawn`
4. `04-waypoint-popup`
5. `05-multi-stage-panel`
6. `06-route-summary-surface`
7. `07-gpx-import-dialog`
8. `08-save-route-dialog`
9. `09-success-toast`
10. `10-route-library`
11. `11-metadata-dialog`
12. `12-delete-confirmation`
13. `13-companion-mode`
14. `14-planner-english`

De screenshots zijn uitsluitend documentatie:
- Ze worden niet vergeleken met een baseline.
- Een mislukte opname voegt een annotatie toe en laat de test nooit falen.
- De map wordt door git genegeerd (`tests/e2e/screenshots/`).

## De suite draaien

```bash
# Leegt tests/e2e/screenshots/planner en draait de vier planner-projecten
npm run test:e2e:planner

# Eén categorie of spec
cd tests/e2e
npx playwright test --project=planner-mobile
npx playwright test planner-responsive/stages --project=planner-tablet

# Met echte OpenStreetMap-tegels (PowerShell)
$env:PLANNER_REAL_TILES = '1'; npm run test:e2e:planner
```

`npm run test:e2e` draait alle projecten, inclusief de vier planner-projecten.
