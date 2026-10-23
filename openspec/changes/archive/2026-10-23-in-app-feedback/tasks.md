## 1. Shared feedback foundation

- [x] 1.1 Create an application-level feedback provider, typed toast API, and toast viewport with success, info, and error variants; verify focused unit tests cover auto-dismiss, persistent errors, three-toast limit, and duplicate coalescing.
- [x] 1.2 Create the reusable confirmation modal with destructive styling, pending state, inline request error, focus trap, Escape behavior, and focus restoration; verify component tests cover confirm, cancel, failed confirmation, and keyboard interactions.
- [x] 1.3 Add responsive styles for toast placement and modal layering that match existing application modals; verify the UI remains usable at desktop and mobile Playwright viewports.

## 2. Integrate confirmations and feedback

- [x] 2.1 Replace the route-library deletion browser confirmation and alerts with the confirmation modal and contextual delete/load/export toasts; verify a successful deletion updates the list and a failed deletion keeps the dialog open.
- [x] 2.2 Replace the administrator user deletion browser confirmation with the confirmation modal and contextual result toasts; verify cancel leaves the user unchanged and API failure is visible in the dialog.
- [x] 2.3 Replace stage deletion confirmation plus stage split/merge browser alerts with the shared feedback UI; verify canceled deletion preserves stage points and successful actions announce their result.
- [x] 2.4 Replace active-route GPX export and unsupported-geolocation browser alerts with toasts, and add success feedback for initiated exports; verify no `alert()` or `confirm()` calls remain in the web source.
- [x] 2.5 Add contextual save/update success feedback while preserving inline save-modal validation errors; verify a saved route toast identifies the route and invalid form input remains inline.

## 3. Localization, accessibility, and validation

- [x] 3.1 Add all feedback labels and contextual messages to Dutch and English locale catalogs with exact key parity; verify the locale parity test or a focused key comparison passes.
- [x] 3.2 Add Playwright coverage for destructive confirmation, success toast, persistent error toast, Escape/focus restoration, and localized feedback at desktop and mobile sizes; verify the focused E2E suite passes.
- [x] 3.3 Run `npm run test:unit`, `npm run test:e2e`, and `npm run build`; verify all pass and update directly related UI documentation if implementation changes documented interaction behavior.
