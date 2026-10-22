# Internationalization (i18n) & Lokalisatie

Dit document beschrijft de architectuur, ontwerpkeuzes en ontwikkelaarsrichtlijnen voor de meertaligheid (**i18n**) in **Hiking Companion**.

---

## 1. Doel & Architectuurvisie

Hiking Companion is ontworpen als een snelle, betrouwbare **Progressive Web App (PWA)** voor langeafstandswandelaars en dagtochten. Wandelaars bevinden zich vaak in afgelegen gebieden met beperkte of afwezige internetverbinding. Daarom zijn de volgende uitgangspunten gehanteerd voor lokalisatie:

1. **Zero External Runtime Dependencies**:
   - Geen zware externe bibliotheken zoals `i18next`, `react-intl` of `formatjs`.
   - Volledig native gebouwd met React Context en een custom hook (`useTranslation`).
   - Minimale bundelomvang en zero overhead voor de browser.
2. **100% Type-Safe & Compile-Time Pariteit**:
   - De Nederlandse catalogus (`nl.ts`) fungeert als de master `TranslationCatalog`.
   - De Engelse catalogus (`en.ts`) is strikt getypeerd tegen `TranslationCatalog`. Als een vertaling ontbreekt of van type verschilt, faalt de TypeScript-compilatie direct tijdens `npm run build`.
3. **Strikte Nederlandse Default (`nl`)**:
   - Elke nieuwe bezoeker ziet **altijd standaard Nederlands**, ongeacht de browser- of besturingssysteemtaal.
   - De bezoeker kan met één klik overschakelen naar Engels (`en`).
4. **Lokale Persistentie**:
   - Een taalkeuze wordt direct opgeslagen in `localStorage` onder `hiking_companion_locale`.
   - Bij herhaald bezoek of een paginareload wordt de opgeslagen voorkeur automatisch toegepast.
5. **Strikte Metrische Notatie**:
   - Afstanden en hoogtes blijven in alle talen metrisch (`km` en `m`). Er vindt geen automatische omrekening plaats naar miles of feet.
   - Wel wordt de lokale decimale scheiding aangepast (bijv. `28,4 km` in het Nederlands vs. `28.4 km` in het Engels).

---

## 2. Architectuuroverzicht

```mermaid
flowchart TD
    Storage[(localStorage: hiking_companion_locale)] -->|Lezen bij opstarten| Provider[I18nProvider React Context]
    Default[Default: 'nl'] -->|Fallback als leeg| Provider
    
    CatalogNL[locales/nl.ts (Master Schema)] --> Provider
    CatalogEN[locales/en.ts (Strikt Type-Checked)] --> Provider
    
    Provider --> Hook[useTranslation()]
    
    Hook --> Header[Header.tsx & LanguageSelector.tsx]
    Hook --> Landing[LandingPage.tsx & showcase.ts]
    Hook --> Planner[App.tsx Sidebar & HUD]
    Hook --> Modals[LoginModal, AdminUsersModal, SaveRouteModal, Library, Metadata]
    Hook --> MapView[MapCanvas.tsx Markers & Popups]
    
    Header -->|setLocale('en') / setLocale('nl')| Provider
    Provider -->|Opslaan| Storage
    Provider -->|Update| DOM["document.documentElement.lang & document.title"]
```

---

## 3. Bestandsstructuur

Alle broncode voor lokalisatie bevindt zich in `apps/web/src/i18n/`:

```text
apps/web/src/i18n/
├── types.ts          # Typen, interfaces, Locale enum ('nl' | 'en') en storage keys
├── index.tsx         # I18nProvider, useTranslation hook en opmaak-helpers
└── locales/
    ├── nl.ts         # Master Nederlandse vertalingen (TranslationCatalog)
    └── en.ts         # Engelse vertalingen (1:1 pariteit met nl.ts)
```

Daarnaast zijn de volgende bestanden direct gekoppeld:
- `apps/web/src/content/showcase.ts`: Tweetalige showcase data (`showcaseContentNl`, `showcaseContentEn`, `getShowcaseContent(locale)`).
- `apps/web/src/components/LanguageSelector.tsx`: De visuele taalschakelaar (`🇳🇱 NL` / `🇬🇧 EN`).
- `apps/web/src/main.tsx`: Root-inrichting met `<I18nProvider>`.

---

## 4. Ontwikkelaarshandleiding

### A. De `useTranslation` Hook gebruiken

Importeer `useTranslation` uit `../i18n` in elk React-component:

```tsx
import React from 'react';
import { useTranslation } from '../i18n';

export const MyComponent: React.FC = () => {
  const { t, formatDistance, formatPriceEur, locale, setLocale } = useTranslation();

  return (
    <div>
      {/* Vaste tekst via dot-notatie */}
      <h2>{t('planner.sidebarTitle')}</h2>

      {/* Dynamische parameter-interpolatie */}
      <p>{t('map.point', { number: 4 })}</p>

      {/* Locale-aware afstand in kilometers */}
      <span>{formatDistance(28.4)}</span>

      {/* Locale-aware prijs in euro's */}
      <span>{formatPriceEur(4.50)}</span>
    </div>
  );
};
```

### B. Dynamische Parameter Interpolatie

Parameters worden in de vertaalcatalogus gedefinieerd met accolades `{paramName}`:

**In `nl.ts`:**
```ts
map: {
  point: 'Punt {number}',
  startPrefix: 'Start: {title}',
},
adminModal: {
  deleteConfirm: 'Weet je zeker dat je account "{name}" permanent wilt verwijderen?',
}
```

**In `en.ts`:**
```ts
map: {
  point: 'Point {number}',
  startPrefix: 'Start: {title}',
},
adminModal: {
  deleteConfirm: 'Are you sure you want to permanently delete account "{name}"?',
}
```

**Aanroep in TypeScript:**
```tsx
t('adminModal.deleteConfirm', { name: 'Karel' })
// NL -> 'Weet je zeker dat je account "Karel" permanent wilt verwijderen?'
// EN -> 'Are you sure you want to permanently delete account "Karel"?'
```

### C. Getal-, Afstands- en Valuta-opmaak

Gebruik altijd de ingebouwde formatting functies van `useTranslation` om consistentie tussen `nl-NL` en `en-US` te garanderen:

| Functie | Invoer | Uitvoer (NL) | Uitvoer (EN) | Toelichting |
| :--- | :--- | :--- | :--- | :--- |
| `formatDistance(km)` | `28.4` | `28,4 km` | `28.4 km` | Altijd metrische kilometers |
| `formatElevation(m)` | `1120` | `1.120 m` | `1,120 m` | Lokale duizendtallen scheider |
| `formatPriceEur(eur)` | `4.5` | `€4,50` | `€4.50` | Vaste 2 decimalen |
| `formatNumber(val, dec)`| `4.2, 1` | `4,2` | `4.2` | Aanpasbaar aantal decimalen |

---

## 5. Nieuwe Vertalingen Toevoegen

Om een nieuwe tekst of sectie toe te voegen, volg je deze stappen:

1. **Open `apps/web/src/i18n/locales/nl.ts`**:
   Voeg de nieuwe sleutel toe aan de relevante namespace:
   ```ts
   export const nl = {
     // ...
     planner: {
       myNewButton: 'Route analyseren',
     },
   };
   ```

2. **Open `apps/web/src/i18n/locales/en.ts`**:
   Omdat `en` getypeerd is als `TranslationCatalog`, markeert de IDE en TypeScript direct een ontbrekende sleutel:
   ```ts
   export const en: TranslationCatalog = {
     // ...
     planner: {
       myNewButton: 'Analyze Route',
     },
   };
   ```

3. **Gebruik in component**:
   ```tsx
   <Button>{t('planner.myNewButton')}</Button>
   ```

4. **Verifieer via type-check**:
   ```bash
   npm run build
   ```

---

## 6. Geautomatiseerde Kwaliteitsborging

De betrouwbaarheid van het i18n-systeem wordt op twee niveaus getest in de CI/CD pipeline:

### A. Unit Tests (`tests/unit/i18n.test.ts`)
- **100% Sleutel-Pariteit**: Controleert recursief of elke sleutel in `nl.ts` aanwezig is in `en.ts` en vice versa.
- **Geen Lege Waarden**: Controleert of er geen lege strings (`""`) of `undefined` velden in de catalogi staan.
- **Interpolatie**: Test of `{param}` correct wordt vervangen en of ontbrekende parameters veilig behouden blijven zonder errors.
- **Default Locale**: Verifieert dat de standaardwaarde onvoorwaardelijk `nl` is.
- **Uitvoeren**:
  ```bash
  npm run test:unit
  ```

### B. Playwright End-to-End Tests (`tests/e2e/e2e/i18n.spec.ts`)
- **Standaardtaal Verificatie**: Bezoekt de landingspagina als nieuwe gast en assert `<html lang="nl">`, Nederlandse hero-titels en de actieve `NL` knop.
- **Taalswitch & Persistentie**: Klikt op `🇬🇧 EN`, controleert realtime vertaling van knoppen en titels, herlaadt de pagina en verifieert dat `localStorage` de keuze behoudt.
- **Planner & Wandelmodus**: Controleert of knoppen in de planner-zijbalk naadloos omschakelen tussen Nederlands en Engels.
- **Cross-device**: Getest op Chromium Desktop, Mobile iPhone en Mobile Pixel.
- **Uitvoeren**:
  ```bash
  npm run test:e2e -- tests/e2e/e2e/i18n.spec.ts
  ```
