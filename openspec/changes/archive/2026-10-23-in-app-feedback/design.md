## Context

The web app currently relies on three native confirmation dialogs for
destructive actions and several native alerts for action-wide failures. These
dialogs are visually inconsistent with existing React modals, cannot share
application accessibility behavior, and do not provide success feedback.
Existing forms already render field-specific errors inline and must retain
that behavior.

## Goals / Non-Goals

### Goals

- Replace every current browser `confirm()` and `alert()` call with consistent
  application UI.
- Offer success, informational, and error feedback for user-initiated
  asynchronous actions.
- Keep destructive actions safe and retryable when their API request fails.
- Meet keyboard and assistive-technology expectations without moving focus for
  notifications.
- Preserve Dutch-English translation-key parity.

### Non-Goals

- Add server-side notification persistence, cross-device notifications, or
  push notifications.
- Add undo for persistent route or account deletions.
- Replace inline form validation with toasts.

## Decisions

### Shared feedback provider and toast viewport

Add a single application-level feedback provider that exposes typed methods
for success, information, and error messages. It owns a toast viewport,
limits visible toasts to three, and coalesces repeated equal messages to avoid
notification flooding.

Success and informational toasts auto-dismiss after four seconds. Error toasts
remain visible until the user closes them. The viewport uses a polite live
region for non-urgent updates and an assertive announcement only for errors;
it never takes focus.

### Reusable confirmation modal

Introduce a reusable confirmation modal with title, descriptive body,
cancel/confirm labels, destructive styling, pending state, and an optional
inline request error. It will be used by saved-route, administrator-user, and
stage deletion flows rather than duplicating dialog state and markup.

The modal captures the trigger element before opening, traps focus while open,
focuses its safe action initially, closes via Escape only while idle, and
returns focus to the triggering control after cancel, success, or close.

### Feedback ownership and action mapping

Each action retains responsibility for handling its domain request and passes
only its user-facing outcome into the feedback provider:

| Flow | On success | On failure |
|---|---|---|
| Save or update route | Contextual success toast | Existing modal error for field/save validation; toast for action-wide failure |
| Delete route, user, or stage | Close confirmation and success toast | Keep dialog open with inline failure |
| Load or export route, export active GPX | Contextual success toast where no browser download feedback exists | Persistent error toast |
| Split or merge stage | Success toast | Persistent error toast |
| Unsupported geolocation | None | Informational/error toast |

Messages reuse current localized error and confirmation strings where they
fit. New generic action labels and contextual success strings are added to
both locale catalogs.

## Architecture

```text
Action component
      |
      +--> Confirmation modal --> domain request --> success/error feedback
      |
      +--> feedback provider --> toast viewport --> ARIA live announcement
```

The provider is mounted once beneath the application root. Existing modals can
render a nested confirmation dialog through the provider or local modal state,
provided only one confirmation dialog is open at a time and its stacking order
remains above its parent modal.

## Risks / Trade-offs

- A confirmation modal opened from another modal needs explicit stacking and
  focus restoration to prevent focus escaping to the page.
- Too many success messages can become distracting; the three-toast cap and
  duplicate coalescing limit that risk.
- A short success timeout can be missed by some users, but completed actions
  remain visible in their updated UI state; errors remain persistent.
- Download completion cannot be verified by the browser after a file handoff,
  so export success means the application generated and initiated the download.
