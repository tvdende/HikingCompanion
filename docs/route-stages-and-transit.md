# Route Stages & Public Transport (Etappebeheer & Openbaar Vervoer)

## 1. Visie & Doelstelling

Langeafstandswandelpaden (zoals het Pieterpad, het Trekvogelpad of Europese GR-routes) bestaan uit afzonderlijke dagetappes. Wandelaars hebben behoefte aan een realistisch overzicht per wandeldag, inclusief kilometers, hoogtemeters, overnachtingslocaties en eventuele verplaatsingen met het openbaar vervoer (bus, trein of veerpont).

Hiking Companion biedt volledige ondersteuning voor meerdaagse tochten via het **Etappebeheer** (`route-stages-management`).

---

## 2. Kernfunctionaliteiten

### 2.1 Multi-Stage Definitie & Splitsen
- **Splitsen op de kaart**: Klik in de editor op een tussenliggend routepunt en kies *"✂️ Splits in nieuwe etappe"*. Alle punten tot en met het gekozen punt blijven in Etappe $N$, en de resterende punten worden direct overgeheveld naar een nieuwe Etappe $N+1$.
- **Nieuwe etappe toevoegen**: Via de knop `+ Nieuwe etappe` in het etappepaneel. De nieuwe etappe sluit standaard naadloos aan op het eindpunt van de vorige etappe.
- **Samenvoegen (Merge)**: Twee opeenvolgende etappes kunnen samengevoegd worden door te klikken op de overgangsbadge op de kaart (`F1 / S2`) of via de knop *"Samenvoegen met vorige"* in de zijbalk.
- **Verwijderen**: Bij het verwijderen van een etappe worden alle bijbehorende routepunten direct gewist van de kaart. De resterende etappes worden automatisch aansluitend hernummerd ($1, 2, 3\dots$).

### 2.2 Openbaar Vervoer (Bus, Trein, Veerpont)
Wandelaars kunnen per etappe het vervoertype instellen:
- 🥾 **Te voet (Wandelen)** (standaard)
- 🚌 **Bus**
- 🚆 **Trein**
- ⛴️ **Veerboot / Pont**

#### Weergave & Statistieken:
- **Kaartvisualisatie**: OV-etappes worden op de kaart weergegeven met een **gestippelde/gestreepte lijn** en tonen een voertuigicoon (🚌, 🚆 of ⛴️) op de overgangsmarker.
- **Kilometer-splitsing**: In de routestatistieken wordt direct onderscheid gemaakt tussen daadwerkelijke loopkilometers en verplaatsingen met openbaar vervoer:
  $$\text{Totaal: } 45\text{ km} \quad (\text{waarvan } 35\text{ km te voet} \ \bullet \ 10\text{ km OV})$$

#### Ondergrond-analyse per wandelstage
- Ondergrondsegmenten zijn gekoppeld aan de stage-ID en tellen uitsluitend voor wandelstages (`foot` of ongespecificeerd transporttype).
- Bus-, trein- en veerbootetappes blijven als gestippelde contextlijnen zichtbaar wanneer de kaart op ondergrondweergave staat, maar tellen niet mee in kilometers of percentages.
- De kaarttoggle wisselt de vaste wandel-etappelijnen in voor groen (onverhard), amber (grind), leigrijs (verhard) en lichtgrijs (onbekend), zonder waypoints of overgangsbadges te verwijderen.

### 2.3 GPX Import, Multi-File Etappes & Polyline Caching
- **Multi-File & Multi-Stage Import**: Wanneer één of meerdere GPX-bestanden tegelijk worden geüpload (via bestandsselectie of drag & drop), toont de importdialoog de optie om **elk bestand automatisch als aparte etappe** aan te maken (`1 bestand = 1 etappe`) of samen te voegen tot één doorlopende etappe.
- **Volgorde bepalen bij meerdere bestanden**: Bij een upload van meerdere bestanden toont de importdialoog (`GpxImportModal`) eerst een geordende lijst (`#gpx-file-order-list`). Die lijst staat standaard in natuurlijke bestandsnaamvolgorde (`etappe-2` vóór `etappe-10`, via `sortFilesNaturally` in `apps/web/src/utils/gpxFileOrder.ts`). Per bestand worden afstand en aantal tracks getoond.
  - Herordenen kan door te slepen (HTML5 drag & drop) of met de knoppen ▲/▼. De knoppen zijn uitgeschakeld aan het begin en eind van de lijst. Na een verplaatsing blijft de toetsenbordfocus op hetzelfde bestand, en een `aria-live`-regio meldt de nieuwe positie.
  - Bestanden kunnen uit de lijst worden verwijderd; het laatste bestand niet.
  - **Volgorde voorstellen** (`suggestFileOrder`) zoekt de keten waarbij de eindpunten van de bestanden het dichtst op elkaar aansluiten. De gebruiker kan die volgorde daarna nog aanpassen.
  - Een bestand dat niet als GPX gelezen kan worden, krijgt een foutmelding in de lijst. Zolang zo'n bestand in de lijst staat, zijn de importknoppen uitgeschakeld.
  - De bevestigde volgorde bepaalt de etappenummering en de volgorde van het samenvoegen (stitching). De etappes uit een bestand met meerdere tracks blijven aaneengesloten.
- **Samengevoegde import**: "Als één samengevoegde etappe importeren" levert altijd precies één etappe op (`stitchGpxRoutes(..., { singleStage: true })`). Is er al een route actief, dan wordt die etappe **na de bestaande etappes toegevoegd** in plaats van de route te vervangen.
- **Append vs. Nieuwe etappe**: Wanneer de gebruiker één GPX uploadt terwijl er al een route actief is, vraagt het dialoogvenster of de punten toegevoegd moeten worden aan de huidige etappe of als nieuwe etappe moeten worden toegevoegd met behoud van de bestaande etappes. Bij meerdere bestanden met een actieve route verschijnt de geordende lijst; nieuwe etappes komen na de bestaande.
- **Meerdere bestanden toevoegen aan de huidige etappe**: Via `GPX toevoegen` (`#btn-append-gpx`) met meerdere bestanden verschijnt de variant *"Bestanden toevoegen aan de route"* met dezelfde lijst en één actie *"In deze volgorde toevoegen"*. De punten worden in de bevestigde volgorde aan de actieve etappe toegevoegd. Eén bestand wordt direct toegevoegd, zonder dialoog.
- **Toegankelijkheid importdialoog**: Bij openen krijgt de dialoog de focus en blijft Tab binnen de dialoog. Escape sluit de dialoog zonder te importeren, en de focus gaat terug naar de knop waarmee de upload werd gestart.
- **Multi-track detectie**: GPX-bestanden met meerdere `<trk>` of `<trkseg>` segmenten (zoals complete LAW-routes) worden automatisch herkend en kunnen als losse etappes of één samengevoegde etappe worden ingelezen.
- **Polyline Caching & Direct Rendering (Geen Herberekening)**: Zodra een route is berekend of geïmporteerd, worden de exacte GPS-lijncoördinaten per etappe opgeslagen in de database (`stagesJson` en `coordinatesJson`). Bij het heropenen van een route worden de lijnen direct getekend vanuit de bewaarde coördinaten zonder zware herberekening via de externe routerings-API (BRouter). Dit voorkomt ontbrekende etappelijnen, timeouts en onnodig dataverkeer.
- **GPX 1.1 Export**: Meerdaagse routes worden geëxporteerd met behoud van afzonderlijke `<trk>` elementen, inclusief etappetitels (`<name>`), overnachtingsnotities (`<desc>`) en transporttypes (`<type>`).

### 2.4 Kaartnavigatie & Dual Camera Views
- **Inzoomen op etappe**: Klikken op een etappekaart in de zijbalk animeert de camera soepel (`fitBounds`) naar de exacte geografische begrenzing van die etappe, met comfortabele marges rondom de zijbalk.
- **Toon hele route**: Een prominente knop bovenaan het etappepaneel herstelt met één klik het zicht naar de complete meerdaagse tocht.
- **Contextuele zichtbaarheid**: Tijdens het bewerken van een specifieke etappe blijft de rest van de route altijd subtiel zichtbaar op de kaart ($0.55$ opacity).

### 2.5 Ergonomische UI, Floating Toolbar & Resizable Zijbalk
- **Centrale Zwevende Werkbalk (`RouteEditorToolbar`)**:
  - Alle algemene routeacties zijn gecentraliseerd in de zwevende balk boven de kaart:
    - Route bewerken (`Punten slepen / Afronden`)
    - Routeringsmodus (`Paden / Recht`)
    - `Ongedaan maken` (Undo) en `Opnieuw uitvoeren` (Redo)
    - `Centreren op route` (Focus)
    - `Omdraaien` (Reverse)
    - `Wissen` (Clear)
    - `Opslaan` (Save)
    - `Mijn Routes` (Bibliotheek)
    - `Beheer & Status` (Metadata, status en prijsbeheer)
- **Opgeschoonde Linkerzijbalk**:
  - Dubbele knoppen (Opslaan, Bibliotheek, Beheer & Status, Route bewerken) zijn verwijderd uit de linkerzijbalk om maximale ruimte te bieden aan het etappeoverzicht.
  - De knoppen `Download GPX` en `GPX toevoegen` staan overzichtelijk en compact naast elkaar in een enkele rij.
- **Sleepbare breedte (Resizable Sidebar)**:
  - De planner-zijbalk kan naar wens breder of smaller worden gesleept via een drag-handle aan de rechterrand (`cursor: col-resize`).
  - **Minimale breedte**: 340px (voorkomt tekst-wrapping of afgekapte knoppen).
  - **Maximale breedte**: 680px (zodat de kaart altijd dominant en goed zichtbaar blijft).
  - **Persistente voorkeur**: De ingestelde breedte wordt automatisch bewaard in `localStorage` (`hiking_planner_sidebar_width`).
  - **Dynamische camerazoom**: Bij het aanroepen van `fitBounds` op de route of een etappe wordt de linker padding dynamisch berekend op basis van de exacte breedte van de zijbalk (`sidebarWidth + 30px`), zodat routes altijd perfect gecentreerd blijven in het zichtbare kaartdeel.
- **Compacte Etappe-kaarten**:
  - Halvering van de verticale kaarthoogte voor snel en ergonomisch beheer van lange meerdaagse tochten.
  - **Rij 1**: Drag-handle (`⋮⋮`), etappe-kleurbadge (`E1`), inline bewerkbare routetitel en verplaatsknoppen (`▲` / `▼`).
  - **Rij 2**: Afstand (`km`), hoogtemeters (`+m`), puntentelling (`pt`), compacte vervoertype-selector (`🥾 Wandelen`, `🚌 Bus`, `🚆 Trein`, `⛴️ Veerpont`), en directe actieknoppen voor samenvoegen (`🔗`) en verwijderen (`🗑️`).
  - **Rij 3 (Optioneel)**: Notitie-invoerveld voor overnachtingen en reisinformatie.

### 2.6 Ruime Route Bibliotheek Tabel & Directe GPX Export
- **Schermvullende Tabelinterface (`library-modal-card`)**:
  - De bibliotheek ('Mijn Routes') wordt weergegeven in een ruime weergave (`width: 96vw`, maximaal `1240px`, maximale hoogte `90vh`) in plaats van een smalle popup.
  - De routes worden gestructureerd gepresenteerd in een overzichtelijke datatabel (`#saved-routes-table`) met sticky header en hover-rijen.
- **Tabelkolommen**:
  1. **Route**: Routetitel, geografische locatie, routeomschrijving en een visuele badge indien de route momenteel actief is in de editor.
  2. **Status**: Statusbadge (`🟢 Definitief` / `🟡 Concept`).
  3. **Afstand & Hoogte**: Totale afstand in kilometers en hoogtemeters (`+m` stijgen / `-m` dalen).
  4. **Etappes**: Aantal etappes van de meerdaagse tocht (direct berekend vanuit `stagesJson` in de API, bijv. `3 etappes`).
  5. **Prijs**: Verkoopprijs op de marktplaats (`€X.XX` of `Gratis`).
  6. **Gewijzigd**: Laatste bewerkingsdatum.
  7. **Acties**:
     - `Laden` (`#btn-load-route-{id}`): Laadt de route direct in de interactieve editor en sluit de modal.
     - `GPX Exporteren` (`#btn-export-route-{id}`): Haalt de volledige routegeometrie op en downloadt direct een gestructureerd GPX 1.1-bestand met behoud van etappes (`<trk>`), transporttypes en notities, zonder de route eerst te hoeven openen in de editor.
     - `Beheren` (`#btn-edit-metadata-route-{id}`): Opent het metadata- en marktplaatsbeheer dialoogvenster.
     - `Verwijderen` (`#btn-delete-route-{id}`): Verwijdert de route na bevestiging.

### 2.7 Differentiële Segmentcalculatie, Caching & 60fps Drag-Preview
- **Differentiële segmentmatching (`diffRouteSegments`)**:
  - Bij elke mutatie in routepunten vergelijkt het systeem de nieuwe puntenparen $(W_i, W_{i+1})$ met de bestaande `segments`.
  - Ongewijzigde segmenten (identieke waypoint-ID's, routeringsmodus en coördinaten binnen $10^{-6}$ graden) worden direct hergebruikt zonder netwerkoproepen.
  - Alleen nieuw toegevoegde of gewijzigde segmenten worden als vuil gemarkeerd voor berekening.
- **Client-Side Segment Cache (`SegmentCache`)**:
  - LRU-cache in de client (tot 1000 segmenten) met gehashte sleutel(`${fLng},${fLat}_${tLng},${tLat}_${mode}`).
  - Bidirectionele padresolutie: voetpaden zijn in twee richtingen begaanbaar. Een verzoek voor $A \to B$ wordt direct opgelost als $B \to A$ in de cache staat, inclusief omkering van coördinaten en omwisseling van stijg- en daalmeters.
  - Undo-, Redo- en routeomkeringsoperaties (`reverseWaypoints`) lossen hierdoor direct op in 0 ms zonder netwerkverkeer.
- **Optimistische UI Preview & Geïsoleerde Fallback**:
  - Bij het toevoegen van een punt wordt direct een optimistische rechte lijn getoond (0 ms visuele vertraging), die naadloos overvloeit in de gesnapte padpolygoon zodra de achtergrondberekening gereed is.
  - Elke segmentberekening is omgeven door een geïsoleerde `try/catch`. Faalt BRouter voor één segment, dan valt alleen dat segment terug naar een rechte lijn; alle andere etappesegmenten behouden hun gesnapte paden.
- **60fps Waypoint Drag Rubber-Banding**:
  - Tijdens het verslepen van een waypointmarker (`onDrag`) tekent MapLibre via een dynamische GeoJSON-laag (`drag-preview-source`) lichte gestippelde elastieklijnen naar de voorgaande en opvolgende punten op 60fps zonder netwerkcalls.
  - De definitieve coördinaten worden pas bij `onDragEnd` gecommit, waarna uitsluitend de 1 of 2 aangrenzende segmenten differentieel worden herberekend.

---

## 3. Datamodel & Types

```typescript
export type TransportType = 'foot' | 'bus' | 'train' | 'ferry';

export interface HikeStage {
  id: string;
  stageNumber: number;
  title: string;
  distanceKm: number;
  coordinates: Coordinate[];
  notes?: string;
  transportType?: TransportType;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
}

export interface RouteStageDefinition {
  id: string;
  stageNumber: number;
  title: string;
  notes?: string;
  transportType?: TransportType;
}

export interface RouteWaypoint {
  id: string;
  coordinate: Coordinate;
  routingMode: RoutingMode;
  name?: string;
  stageId?: string; // Koppeling aan specifieke etappe
}
```

---

## 4. Kleurenpalet per Etappe

De etappes roteren door een outdoor kleurenpalet:
1. **Etappe 1**: Forest Green (`#24583d`)
2. **Etappe 2**: Ochre Terracotta (`#c26d2e`)
3. **Etappe 3**: Slate Mountain Blue (`#33658a`)
4. **Etappe 4**: Purple Sage (`#6b4c7a`)
5. **Etappe 5**: Dark Pine (`#1d3557`)
6. **Etappe 6**: Ocean Cyan (`#0e7490`)
7. **Etappe 7**: Warm Amber (`#b45309`)

Overgangsbadges op de kaart (`F1 / S2`) combineren de kleuren van beide etappes in een subtiele tweekleurige verloopbadge.
