# djangobuilder5 — Always-on models panel on large screens

**Date:** 2026-07-12
**Goal:** On large screens the docked models editor is a **permanent, non-closable** side panel (you can't hide it). Below the docking width it stays the closable modal.

> User was away for the "which app" question; proceeding with the recommended behaviour: the panel **follows the app of the file you're viewing**, keeping the last app while on a project-level file.

## Behaviour

- **≥ 1536px (docked):** the models panel is **always rendered** as the right rail — no ✕, no Done, cannot be closed. It edits the **current app** = the app of the currently-viewed file (`rendered.path`), falling back to the last-viewed app, then the first app. Navigating the tree to another app's file switches the panel. `✎ / "Edit models"` on large screens just **navigate** to that app's `models.py` (the panel follows).
- **< 1536px (modal):** unchanged — `✎ / "Edit models"` opens the centered, closable `ModelsModal`.
- No apps in the project → no panel (nothing to edit).

## Changes

- **`ModelsPanel`**: make `onClose` **optional**. When absent (docked/always-on): hide the header ✕ and the footer Done (non-closable); the "app vanished" effect and Delete-app call `onClose?.()` (a no-op when docked — `BuilderShell` re-derives the current app instead). When present (modal): unchanged.
- **`BuilderShell`**:
  - `dockedAppId` state = the panel's current app. An effect sets it from the viewed file's app (`rendered.path`), else keeps the current app if still valid, else the first app.
  - `editModels(appName)`: `wide` → `setPath("<app>/models.py")` (navigate; panel follows); `!wide` → `setEditingAppId(app.id)` (modal).
  - Render: `wide && dockedAppId` → the docked `<aside>` with `<ModelsPanel appId={dockedAppId} />` (no `onClose`). `!wide && editingAppId` → `<ModelsModal>` (with `onClose`).
- **`ModelsModal`**: unchanged (always passes `onClose`, so keeps ✕/Done).

## Data flow

Panel edits are write-through as before. The docked app is derived from the current file selection + a remembered fallback, so it's stable while browsing non-app files and updates when you open an app's file. Deleting the docked app resets the panel to the first remaining app (or hides it if none remain).

## Testing

- `BuilderShell.test`: with the media hook **true**, the docked panel renders **immediately** (no click needed) for the first app, and no modal appears; `Edit models` on wide navigates (no modal). With the hook **false**, `Edit models` opens the modal and no dock renders.
- `ModelsPanel.test` (new): with `onClose` → shows Close + Done; without `onClose` → neither is rendered (non-closable), but Add model / Import / model list still render.
- `ModelsModal.test`: unchanged.

## Out of scope

- A user toggle to hide/pin the panel; remembering panel state across reloads; changing the 1536px breakpoint or the right-rail side (separate open question).
