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

### 2.3 GPX Import & Export Pariteit
- **Append vs. Nieuwe etappe**: Wanneer de gebruiker een GPX uploadt terwijl er al een route actief is, vraagt een dialoogvenster of de punten toegevoegd moeten worden aan de huidige etappe of dat er een nieuwe etappe gestart moet worden.
- **Multi-track detectie**: GPX-bestanden met meerdere `<trk>` of `<trkseg>` segmenten (zoals complete LAW-routes) worden automatisch herkend. De gebruiker kan kiezen:
  1. *Als losse etappes importeren* (behoudt de dagetappes inclusief etappenamen en notities).
  2. *Als één samengevoegde etappe importeren*.
- **GPX 1.1 Export**: Meerdaagse routes worden geëxporteerd met behoud van afzonderlijke `<trk>` elementen, inclusief etappetitels (`<name>`), overnachtingsnotities (`<desc>`) en transporttypes (`<type>`).

### 2.4 Kaartnavigatie & Dual Camera Views
- **Inzoomen op etappe**: Klikken op een etappekaart in de zijbalk animeert de camera soepel (`fitBounds`) naar de exacte geografische begrenzing van die etappe, met comfortabele marges rondom de zijbalk.
- **Toon hele route**: Een prominente knop `🔍 Toon hele route` bovenaan het paneel herstelt met één klik het zicht naar de complete meerdaagse tocht.
- **Contextuele zichtbaarheid**: Tijdens het bewerken van een specifieke etappe blijft de rest van de route altijd subtiel zichtbaar op de kaart ($0.55$ opacity).

### 2.5 Ergonomische UI & Resizable Zijbalk
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
