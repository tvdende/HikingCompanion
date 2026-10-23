## MODIFIED Requirements

### Requirement: GPX Import Multi-Stage & Append Handling
The system SHALL provide interactive choices when importing GPX data:
- When a single GPX file is imported while an active route already exists, the system SHALL prompt the user to choose:
  1. "Toevoegen aan huidige etappe" (Append points to active stage)
  2. "Als nieuwe etappe toevoegen" (Create a new sequential stage for this GPX)
- When an imported GPX contains multiple `<trk>` or `<trkseg>` elements, the system SHALL prompt the user:
  1. "Als losse etappes importeren" (Import each track segment as an individual stage)
  2. "Als één samengevoegde etappe importeren" (Merge all tracks into a single stage)
- When multiple GPX files are imported at once, the system SHALL show them as an ordered, reviewable list before importing, both for a fresh import, for an import while an active route exists, and for an append to the active stage. The confirmed list order SHALL determine the stage order or the order in which track points are appended.
- When an active route exists, both separate-stage and merged imports SHALL add the new stage or stages after the existing stages; a merged import SHALL NOT replace the active route.
- The import dialog SHALL be fully operable by keyboard: it SHALL move focus into the dialog when it opens, keep Tab focus within the dialog, close on Escape without importing, and return focus to the control that opened the upload when it closes.

#### Scenario: User uploads GPX while working on an existing route
- **GIVEN** an active route open in the planner
- **WHEN** user uploads a GPX file
- **THEN** a modal dialog asks whether to append to the active stage or create a new stage
- **AND** selecting "Als nieuwe etappe toevoegen" creates a new stage preserving existing stages intact

#### Scenario: User imports multi-track GPX trail (e.g. Pieterpad)
- **WHEN** user uploads a GPX file containing multiple `<trkseg>` elements
- **THEN** a modal prompts the user whether to import as separate stages or a single stage
- **AND** choosing separate stages generates an ordered list of stages corresponding to each segment

#### Scenario: User uploads multiple ordered files to an active route
- **GIVEN** an active route with existing stages open in the planner
- **WHEN** the user uploads several GPX files at once, reorders them, and imports them as separate stages
- **THEN** the new stages are added after the existing stages in the confirmed order, and the existing stages remain unchanged

#### Scenario: Merged import appends to an active route
- **GIVEN** an active route with existing stages open in the planner
- **WHEN** the user uploads several GPX files at once and imports them as one merged stage
- **THEN** exactly one new stage is added after the existing stages, and the existing stages remain unchanged

#### Scenario: User appends multiple files to the active stage in order
- **GIVEN** an active route open in the planner
- **WHEN** the user chooses to append GPX data to the active stage and selects several files at once
- **THEN** a dialog lists the files in natural filename order and lets the user reorder or remove them
- **AND** confirming appends the track points of the files to the active stage in the confirmed order

#### Scenario: Single file appended to the active stage
- **WHEN** the user chooses to append GPX data to the active stage and selects one file
- **THEN** the track points are appended directly without an ordering dialog

#### Scenario: Import dialog is keyboard accessible
- **WHEN** the GPX import dialog opens after the user activated an upload control
- **THEN** keyboard focus moves into the dialog and Tab cycles within the dialog
- **AND** pressing Escape closes the dialog without importing and returns focus to the upload control
