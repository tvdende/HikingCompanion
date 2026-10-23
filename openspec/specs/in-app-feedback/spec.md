# in-app-feedback Specification

## Purpose

Provides consistent, accessible in-application feedback so users can safely
confirm destructive actions and understand whether initiated actions succeed,
fail, or need attention.

## Requirements

### Requirement: Destructive actions use in-application confirmation dialogs

The system SHALL present an in-application confirmation dialog before
permanently deleting a saved route or user account, and before deleting a
route stage and its points. The dialog SHALL identify the affected object,
describe the irreversible consequence, offer a safe cancel action, and
visually distinguish the destructive confirmation action.

#### Scenario: User confirms saved route deletion

- **WHEN** a user chooses to delete a saved route and confirms its dialog
- **THEN** the system deletes that route and displays a success toast naming
  the deleted route

#### Scenario: User cancels stage deletion

- **WHEN** a user opens the deletion dialog for a route stage and chooses
  cancel or closes the dialog
- **THEN** the stage and all of its route points remain unchanged

#### Scenario: Destructive request fails

- **WHEN** a user confirms a destructive action and its request fails
- **THEN** the dialog remains open, reports the failure, and allows the user to
  retry or cancel without reporting success

### Requirement: Action feedback uses non-blocking toasts

The system SHALL use in-application toast notifications rather than native
browser alerts for action-wide success, informational, and error feedback.
Success and informational toasts SHALL dismiss automatically after a brief
period; error toasts SHALL remain visible until the user dismisses them.

#### Scenario: Route save succeeds

- **WHEN** a user saves a route successfully
- **THEN** the system displays a success toast that identifies the saved route

#### Scenario: Route export fails

- **WHEN** route export fails after the user starts it
- **THEN** the system displays a persistent error toast with the export error
  and does not display a native browser alert

#### Scenario: Geolocation is unsupported

- **WHEN** a user requests their current location in a browser without
  geolocation support
- **THEN** the system displays an informational or error toast explaining
  that geolocation is unavailable

### Requirement: Feedback UI is accessible and localized

The system SHALL provide Dutch and English text for feedback controls and
messages. Confirmation dialogs SHALL support keyboard operation, dismiss on
Escape when no request is running, confine keyboard focus while open, and
restore focus to their invoking control when closed. Toasts SHALL announce
their content without moving keyboard focus.

#### Scenario: Keyboard user cancels a dialog

- **WHEN** a keyboard user opens a destructive confirmation dialog and presses
  Escape before confirming
- **THEN** the dialog closes and focus returns to the control that opened it

#### Scenario: Screen reader receives toast feedback

- **WHEN** an action completes and displays a toast
- **THEN** assistive technology receives the toast message through a live
  announcement without interrupting the user's current focus

#### Scenario: User changes application language

- **WHEN** the user switches the application language before triggering
  feedback
- **THEN** the dialog or toast uses the selected language
