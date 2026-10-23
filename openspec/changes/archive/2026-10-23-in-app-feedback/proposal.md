## Why

Native browserdialogen onderbreken de routeplanner en sluiten niet aan bij de
visuele stijl of toegankelijkheid van de applicatie. Gebruikers krijgen
bovendien geen consistente bevestiging wanneer een route of andere actie
succesvol is afgerond.

## What Changes

- Vervang alle browser-`confirm()`-dialogen voor route-, gebruiker- en
  etappeverwijdering door consistente, destructieve bevestigingsmodals.
- Introduceer globale toasts voor succesvolle, informatieve en foutmeldingen,
  inclusief duidelijke context bij afgeronde gebruikersacties.
- Vervang alle browser-`alert()`-meldingen door toasts, terwijl
  veldgebonden formulierfouten inline blijven.
- Waarborg toetsenbord- en screenreaderondersteuning voor modals en toasts.
- Voeg Nederlandse en Engelse vertalingen toe voor de nieuwe feedback-UI.

## Capabilities

### New Capabilities

- `in-app-feedback`: consistente, toegankelijke bevestigingsmodals en
  niet-blokkerende toastmeldingen voor gebruikersacties.

### Modified Capabilities

- Geen.

## Impact

- Betreft de React-frontend, met name `App.tsx`, `RouteLibraryModal.tsx`,
  `AdminUsersModal.tsx`, `StageManagerPanel.tsx` en `MapCanvas.tsx`.
- Voegt gedeelde frontendcomponenten en een feedbackprovider of -context toe;
  er zijn geen API- of databaseschemawijzigingen nodig.
- Breidt frontendunit- en Playwrightdekking uit voor destructieve acties,
  foutafhandeling, successignalen en toegankelijk gedrag.
