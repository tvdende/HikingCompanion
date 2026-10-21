# Capability: Internationalization (NL & EN Localization)

## Purpose

Enable full bilingual operation of Hiking Companion in Dutch (default) and English across all UI views, toolbars, dialogs, map controls, and notifications.

## Requirements

### Requirement: Default Language & Language Selection
The frontend application SHALL:
- Default to Dutch (`nl`) on initial launch
- Provide a persistent language toggle in the header and settings allowing users to switch between Dutch (`nl`) and English (`en`)
- Store the user's language preference in `localStorage` under `hiking_language` and synchronize with user profile if authenticated

#### Scenario: First-time visitor opens the app
- GIVEN a new visitor opening the website
- WHEN the app loads
- THEN the interface displays all system texts in Dutch (`nl`)

#### Scenario: User switches to English
- GIVEN the app is displaying Dutch texts
- WHEN the user clicks the language toggle and selects `EN`
- THEN all interface labels, buttons, tooltips, and modal titles switch immediately to English without a page reload
- AND the choice is remembered across future sessions

### Requirement: Full System Text Coverage
Every visible text, button label, dialog message, error prompt, and tooltip MUST be translated:
- Navigation & headers (Routes, Bibliotheek, Plannen, Navigatie, Inloggen, Uitloggen)
- Route Planner (Punt toevoegen, Paden volgen, GPX uploaden, Route opslaan, Wispunt verwijderen)
- Route Library & Details (Concept, Definitief, Zoeken, Prijs, Locatie, Bewerken, Verwijderen)
- Surface Breakdown (Onverhard, Grind, Verhard, Onbekend, Analyseer ondergrond)
- Weather & Alerts (Temperatuur, Neerslag, Windstoten, Onweer, Weerbericht)
- POI Categories (Drinkwater, Supermarkt, Camping, Berghut, Hostel, Hotel, Toiletten, Zoek voorzieningen)
- Live Navigation (Afstand resterend, Hoogteverschil, Van route af, Noodnummers, Start navigatie)
- Packing Lists & Gear (Uitrusting, Slapen, Koken, Eetgerei, Kleding, Toiletspullen, Aantrekken, Afwas)

### Requirement: Locale-Aware Formatting
The system SHALL format numbers, dates, times, and currencies according to the active locale:
- Dutch (`nl`): comma decimal separator (`14,2 km`), 24-hour time (`14:30`), date format `DD-MM-YYYY`
- English (`en`): dot decimal separator (`14.2 km`), 24-hour/12-hour support, date format `YYYY-MM-DD` or `MMM D, YYYY`
