# djangobuilder5 — File-tree builder + modal model editing

**Date:** 2026-07-09
**Goal:** Collapse the builder to a single navigation tree (the generated file tree) + code, and move all model editing into a per-app modal.

## Problem

Even after the tabbed-workspace change, the builder still carries two navigation metaphors: the models panel (`TreePane`, apps→models) and the Code tab's generated-file tree. The **Design** tab exists solely to host the model editor. That's redundant. We want a single VS-Code-like surface (file tree + code) and model editing in a modal.

## Design

Remove the models panel and the Design tab. The builder becomes **file tree + code**. Editing an app's models happens in a **modal** that lists *all* of that app's models in one scrollable panel.

```
Builder:  ProjectHeader
          ├─ FileTree (persistent lg / drawer below lg)   ← the only nav; "＋ App" at its root
          └─ CodeView (selected file, read-only)          ← "✎ Edit models" in header when models.py

Modal (per app):  Edit models · <app>          [Delete app] [✕]
                  ├─ ModelEditor  (Product): name · abstract · fields · relationships · delete
                  ├─ ModelEditor  (Order):   …
                  ├─ ModelEditor  (Customer):…
                  └─ ＋ Add model
                                                          [Cancel] [Done]
```

Because `models.py` is per-app and holds *all* the app's models, the modal is an **app-scoped models editor**: every model shown at once (fully expanded), each an independent `ModelEditor` block.

### Component changes

- **Delete `TreePane`** (+ test). Its jobs move: *add app* → the file tree; *add model* / *select model* → the modal.
- **Delete `EditorPane`** (+ test). Its field/relationship editing UI is extracted into a reusable **`ModelEditor`** (one model) used by the modal.
- **`ModelEditor`** (new): editable model **name** (always-on input), **abstract** checkbox, Fields (add/edit/remove), Relationships (add/edit/remove), **delete model** (with confirm). Reuses the debounced-input + row markup from the old `EditorPane`.
- **`ModelsModal`** (new): props `{ appId, onClose }`. Header shows the app name + **Delete app** (confirm) + close. Body maps `app.models` → `ModelEditor`. Footer: **＋ Add model** (adds a `NewModel`, editable inline) and **Done**/**Cancel** (both just close — edits are write-through/live).
- **`DebouncedInput`**: promote from inside `EditorPane` to a shared `src/components/ui/DebouncedInput.tsx` (used by `ModelEditor`; behaviour unchanged — focused-ref guard + unmount-cancel).
- **`CodeView`** (new, extracted from `CodePane`): renders the selected file (`renderNodeByPath`) with the code header — path tab, **Copy**, and an **✎ Edit models** button shown only when the selected file is a `*/models.py`, calling `onEditModels(appId)`.
- **`FileTree`**: add an **`onEditModels(appId)`** affordance (a small `✎`) on `models.py` file rows, and an **`onAddApp`** control (an inline "＋ App" name input) at the tree root. Resolve the app from the node's path (`appName = path.split("/")[0]` → look up the app id in the project).
- **`CodePane`**: dissolved — its file-selection state (`selectedPath`/`defaultPath`) moves up to `BuilderShell`; the render half becomes `CodeView`.
- **`BuilderShell`**: owns `selectedPath` (file), `drawerOpen` (mobile tree), and `editingAppId` (modal). Layout: `ProjectHeader` + `FileTree` (persistent `lg` / drawer below `lg`, toggled by the header hamburger) + `CodeView`. No tabs. Renders `<ModelsModal appId={editingAppId}>` when set.
- **`ProjectHeader`**: the hamburger now toggles the **file-tree** drawer (was the models drawer). Otherwise unchanged (name, description, chips, Settings, Download).

### Store / writes changes

- Add **`updateModel(appId, modelId, patch)`** → `fs.updateModel(modelId, patch)` (for rename + abstract). `fs.updateModel` already exists; only the store action is missing.
- Add **`removeApp(appId)`** → new `fs.removeApp(projectId, app)` that batch-deletes the app's models (and their fields/relationships), the app doc, and the app's key in the project's `apps` map — mirroring `removeModel` + `deleteProjectCascade`.
- `addApp`, `addModel`, `addField`/`updateField`/`removeField`, `addRelationship`/`updateRelationship`/`removeRelationship`, `removeModel` — unchanged, now called from the modal / file tree.
- `selectedModelId` and `select()` become unused (no Design tab); remove them. Keep `selectedAppId` (drives the default file = that app's `models.py`).

## Data flow

All edits stay write-through: `ModelEditor`/`ModelsModal` call store actions → `writes.ts` → Firestore, echoed back live via `onSnapshot`. The modal reads the app/models from the store, so as you add fields the underlying `models.py` (visible again once you close) regenerates automatically. No local editing buffer.

## Error handling

- Opening the modal for an app that vanished (deleted in another tab) → `ModelsModal` renders nothing / closes.
- `renderNodeByPath` already returns `null` for stale paths; `CodeView` keeps its empty-state + default-file fallback.
- Deleting the app you're viewing closes the modal and resets the selected file to the first remaining app's `models.py` (or the project's `settings.py` if no apps remain).

## Testing

- `ModelEditor.test`: renders a model's fields/relationships; editing name/args calls `updateModel`/`updateField`; abstract toggles `updateModel`; delete calls `removeModel` (after confirm).
- `ModelsModal.test`: lists all of the app's models; ＋ Add model calls `addModel`; Delete app confirms → `removeApp` + closes; Done/Cancel close.
- `CodeView.test`: renders the selected file; "Edit models" appears only for `models.py` and fires `onEditModels` with the right app id; Copy works.
- `FileTree.test`: the `models.py` row exposes an edit control that fires `onEditModels`; the "＋ App" input fires `onAddApp`.
- `BuilderShell.test`: file tree persistent vs. drawer; opening the modal from the tree edit control and from the code header; ModelsModal renders with the chosen app; no Design/Code tabs exist.
- `projectStore.test`: `updateModel` forwards the patch; `removeApp` delegates the cascade.
- `writes.test`: `removeApp` batches every descendant + the project map key + commits once.
- Delete `EditorPane.test` and `TreePane.test`.

## Out of scope

- Renaming a model does **not** rewrite relationship `to` targets that referenced the old `app.Model` name (pre-existing behaviour; a model rename can dangle a relationship target — same as db4).
- App **rename** (no UI today; not added — `＋ App` names the app once at creation).
- Master-detail or accordion modal (chosen: all models expanded in one panel).
- Side-drawer variant of the editor (chosen: centered modal).

## Checklist

1. `writes.removeApp` + `writes.test` (+ `store.removeApp`, `store.updateModel` + `store.test`).
2. Promote `DebouncedInput` to a shared component.
3. `ModelEditor` (+ test).
4. `ModelsModal` (+ test).
5. `FileTree`: `onEditModels` row control + `onAddApp` root input (+ test).
6. `CodeView` extracted from `CodePane` (+ test).
7. `BuilderShell`: file-tree nav + drawer + modal state; delete tabs; wire entry points.
8. Delete `TreePane`, `EditorPane`, `CodePane` (+ their tests); update `BuilderPage`.
9. Remove unused `selectedModelId`/`select` from the store.
10. Full suite + lint + typecheck + build green, then verify live (desktop + narrow).
