## MODIFIED Requirements

### Requirement: Multi-GPX Upload and Track Stitching
The system SHALL support uploading multiple GPX files simultaneously or sequentially, parsing each track into structured stages, and stitching the tracks together into a single continuous `HikeRoute` with combined distance, stage boundaries, and unified elevation metrics.

When multiple files are uploaded at once, the system SHALL show them as an ordered, reviewable list before importing, and SHALL use the confirmed list order for stage numbering and stitching. The initial order SHALL be the natural filename order, where numeric parts are compared by value. Users SHALL be able to reorder files by dragging and with keyboard-accessible move-up and move-down controls. They SHALL also be able to remove files from the list and request a suggested order based on how closely file endpoints connect.

Each listed file SHALL show its distance and number of tracks, or an error if it cannot be read. Import SHALL NOT be possible while the list contains an unreadable file.

#### Scenario: User uploads multiple GPX files at once
- **WHEN** the user selects or drops multiple `.gpx` files onto the planner interface and confirms an import option without changing the order
- **THEN** the system parses all files, concatenates their track points in the listed order, joins the endpoints with geodesic straight-line segments, and recalculates the total trail metrics

#### Scenario: Files are listed in natural filename order
- **WHEN** the user uploads `etappe-10.gpx`, `etappe-2.gpx`, and `etappe-1.gpx` together
- **THEN** the import dialog lists the files as `etappe-1.gpx`, `etappe-2.gpx`, `etappe-10.gpx`, numbered 1 to 3

#### Scenario: Listed files show their details
- **WHEN** the import dialog lists the uploaded files
- **THEN** each file shows its distance in kilometers and its number of tracks

#### Scenario: User reorders files with move buttons
- **WHEN** the user moves the third listed file up twice and imports each file as separate stages
- **THEN** the stages from that file come first, followed by the stages of the other files in their remaining listed order

#### Scenario: Keyboard focus follows a moved file
- **WHEN** a keyboard user activates a move control of a listed file
- **THEN** the file moves one position, keyboard focus stays on a control of that same file, and the new position is announced to assistive technology

#### Scenario: User reorders files by dragging
- **WHEN** the user drags a listed file to another position in the list
- **THEN** the list numbering updates to the new order and the import uses that order

#### Scenario: Move controls are bounded
- **WHEN** a file is first in the list
- **THEN** its move-up control is disabled, and when a file is last in the list its move-down control is disabled

#### Scenario: File with multiple tracks keeps its stages together
- **WHEN** one listed file contains two tracks and the user imports each file as separate stages
- **THEN** both stages from that file appear consecutively, at the position of that file in the confirmed order

#### Scenario: User requests a suggested order
- **WHEN** the user requests a suggested order for files whose endpoints connect as B → A → C
- **THEN** the list is reordered to B, A, C, and the user can still adjust it before importing

#### Scenario: User removes a file from the list
- **WHEN** the user removes a listed file
- **THEN** the file is excluded from the import and the remaining files are renumbered, and the last remaining file cannot be removed

#### Scenario: Unreadable file blocks import
- **WHEN** one of the uploaded files cannot be parsed as GPX
- **THEN** that file shows an error in the list, the import options are disabled, and importing becomes possible after the user removes that file

#### Scenario: Merging multiple files yields one stage
- **WHEN** the user reorders the files and imports them as one merged stage
- **THEN** the result contains exactly one new stage whose track points are the files concatenated in the confirmed order

#### Scenario: User cancels the import dialog
- **WHEN** the user cancels the multi-file import dialog after reordering or removing files
- **THEN** no files are imported and the current route remains unchanged

#### Scenario: User appends GPX file to existing active route
- **WHEN** the user selects an additional GPX file to append to an active route
- **THEN** the system adds the new track points as a new stage continuing from the last point of the existing route

#### Scenario: Ordering UI is localized
- **WHEN** the application language is Dutch or English
- **THEN** the ordering instructions, file details, errors, controls, and their accessible labels are shown in that language
