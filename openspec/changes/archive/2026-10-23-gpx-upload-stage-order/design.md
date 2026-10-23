## Context

Multi-file GPX uploads flow through `handleGpxFiles` in `apps/web/src/App.tsx`.
This function reads every file's text and opens `GpxImportModal` with type
`multi-file`. The chosen strategy is passed to
`executeGpxProcessing(files, texts, strategy)`, which parses the files in
array order and calls `stitchGpxRoutes`. Parsing therefore only happens
after a choice is made, so errors appear as one generic message.

Observed current behavior that this change must address:

1. **No active route:** the `multi-file` modal offers "separate stages" and
   "merged single".
2. **Active route, not in append mode:** the same modal is shown. "Separate
   stages" appends new stages, while "merged single" falls through to the
   fresh-import branch and replaces the active route.
3. **Append mode (`triggerAppendGpx`):** the modal is skipped and
   `append-active` runs in browser order.
4. **Merged single with multiple files:** `parseGpx(..., { mergeSegments })`
   only merges segments within one file. `stitchGpxRoutes` still emits one
   stage per input route, so the result is not a single stage.
5. **Hardcoded titles:** `App.tsx` uses `'Etappe 1'` and
   `` `Etappe ${n}` ``. The existing translation key
   `planner.stageDefaultTitle` (`Etappe {number}` / `Stage {number}`) covers
   these titles.
6. **Modal accessibility:** `GpxImportModal` has `role="dialog"` but no
   Escape handling, focus trap, or focus restoration.
   `ConfirmationModal` (from `in-app-feedback`) already implements these
   behaviors.

`StageManagerPanel` already reorders stages with native HTML5 drag events and
move-up/move-down buttons, using the `stages.moveUp`, `stages.moveDown`, and
`stages.dragToReorder` translation keys. `calculateHaversineDistanceKm` is
exported from `packages/core`.

## Goals / Non-Goals

**Goals:**
- Use one reviewable, ordered file list in the multi-file dialog for every
  multi-file path.
- Detect broken files before the user commits to an import option.
- Make "merged single" produce one stage and never silently replace an active
  route.
- Reuse the existing reorder pattern, focus-management approach, and
  translation keys.

**Non-Goals:**
- Reordering track segments inside a single GPX file (`multi-track` dialog).
- Reversing a file's direction when suggesting an order.
- Reordering stages after import, which `StageManagerPanel` already handles.
- Translating fallback stage titles generated inside `packages/core`
  (`stitchGpxRoutes`, parser defaults). Those titles are data defaults rather
  than UI text, and changing them would require threading the locale into
  core.
- API or persistence changes.

## Decisions

### 1. Pre-parse files into `PendingGpxFile` entries
When a multi-file dialog opens, `App` parses each text with
`parseGpx(text, name, { mergeSegments: false })` inside a per-file
`try/catch`. It then builds:

```
PendingGpxFile { id, file, text, name, distanceKm?, trackCount?,
                 start?: Coordinate, end?: Coordinate, error?: string }
```

The pending payload becomes `PendingGpxFile[]` instead of parallel
`files`/`texts` arrays. At import time, `executeGpxProcessing` still parses
again with the strategy-specific `mergeSegments` flag. The extra parse is
cheap and keeps the execution path unchanged.

- *Why:* This allows per-file details and errors in the list, and keeps each
  file, text, and metadata entry together through reordering and removal.
- *Alternative:* Parse once and reuse the parsed routes. This was rejected
  because the merge flag changes the parse output.

### 2. The modal owns order and removal and returns the final list
`GpxImportModal` receives `files: PendingGpxFile[]`, keeps local ordered state
(initialized when the dialog opens), and calls
`onChoice(choice, orderedFiles)`. Removed files are omitted. Removal is
disabled when only one file remains. Import buttons are disabled while any
listed file has an `error`.

- *Alternative:* Hoist order state into `App`. This would grow an already
  large component and was rejected.

### 3. Pure ordering helpers in `apps/web/src/utils/gpxFileOrder.ts`
- `sortFilesNaturally(files)`: a stable sort with
  `a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })`.
- `suggestFileOrder(files)`: for each candidate start file, build a
  greedy nearest-neighbor chain from `end` to the closest remaining
  `start` using `calculateHaversineDistanceKm`. Choose the chain with the
  smallest total gap. Ties keep the current relative order. With fewer than
  10 files, O(n³) is negligible. Files without coordinates keep their
  relative order at the end.

- *Why:* Pure functions can be unit-tested in `tests/unit` in Node.
- *Alternative:* An exact shortest-path search. This is overkill for a
  handful of files, and the greedy multi-start approach handles the realistic
  case of a sequential multi-day hike.

### 4. Reorder interaction mirrors StageManagerPanel
Each `<li>` contains a drag handle, position number, filename (with ellipsis
and the full name in `title`), distance and track count or an error, and
these buttons: move up, move down, and remove. Native
`draggable`/`onDragStart`/`onDragOver`/`onDrop` handles dragging. After a
button move, focus moves to the same control on the moved item. If that
control is now disabled at the list boundary, focus moves to the item's other
move button. A polite live region announces the new position.

- *Alternative:* `@dnd-kit/sortable`. It adds a dependency for a small list
  and was rejected.

### 5. GPX import modal gets ConfirmationModal-style focus management
`GpxImportModal` closes on Escape, traps Tab inside the dialog, focuses the
first meaningful control on open, and restores focus to an explicit trigger
element on close. `App` records the upload button or drop zone as the trigger.
The focus helpers follow the same approach as `ConfirmationModal`.

### 6. Merged single produces one stage and appends with an active route
Add `singleStage?: boolean` to `StitchGpxOptions` in
`packages/core/src/gpx/stitcher.ts`. When `true`, all stitched coordinates,
including gap bridges, become one stage. In `executeGpxProcessing`,
`merged-single` passes `singleStage: true`. When `currentRoute` exists,
`merged-single` uses the same branch as `new-stage` and appends that single
stage after the existing stages instead of replacing the route.

- *Alternative:* Collapse stages in `App`. This was rejected because the
  metric recalculation already lives in core and should stay there.

### 7. A `multi-file-append` modal variant
When `append === true` and `files.length > 1`, the modal opens as
`multi-file-append`. It shows the ordered list and one primary action, "Add in
this order" (`append-active`). A single-file append still skips the dialog.

### 8. Translation keys
- Reuse `stages.moveUp`, `stages.moveDown`, `stages.dragToReorder`, and
  `planner.stageDefaultTitle`.
- Add matching `gpxModal` keys to `nl.ts` and `en.ts`: `orderHint`,
  `orderListLabel`, `orderPosition`, `movedAnnouncement`, `fileDetails`,
  `fileError`, `btnRemoveFile`, `removedAnnouncement`, `btnSuggestOrder`,
  `orderSuggestedAnnouncement`, `importBlockedByErrors`,
  `multiFileAppendTitle`, `multiFileAppendSubtitle`, and `btnAppendInOrder`.

## Risks / Trade-offs

- [HTML5 drag-and-drop does not work on most touch browsers] → Move buttons
  stay visible and are the primary mobile and keyboard mechanism.
- [Playwright drag-and-drop can be flaky] → Use buttons as the primary E2E
  path, and run one drag scenario on desktop only with `dragTo`.
- [Pre-parsing large files adds dialog latency] → Parse synchronously after
  the texts are already read. Typical multi-day GPX files are small. Revisit
  if users report delays.
- [Changing merged-single with an active route alters existing behavior] →
  The new behavior is non-destructive, and the proposal flags the change.
- [Suggested order can be wrong for loops or overlapping tracks] → The
  suggestion only reorders the list. The user reviews it before importing.
- [Long filenames or many files] → Use ellipsis truncation, a full-name
  `title`, and a scrollable list with a maximum height.
- [Core fallback titles remain Dutch] → This is an explicit non-goal, and
  imported GPX track names normally override them.
