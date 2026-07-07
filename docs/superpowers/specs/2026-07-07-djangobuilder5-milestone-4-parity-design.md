# djangobuilder5 — Milestone 4: Builder Parity

**Date:** 2026-07-07
**Goal:** Bring the db5 builder to parity with the current production system (db4 + the `.io` site) by closing the five functional gaps the user identified.

## Problem

The db5 builder is a bare three-pane shell (`Tree | Editor | Code`) with no project chrome. Five capabilities present in the current system are missing:

1. **No project files shown.** The code pane renders only the five app files (`models/admin/serializers/views/urls.py`) for the selected app. The current system shows the *whole* generated project via a file tree (`renderer.asTree`): root files, the project package (`settings.py`, project `urls.py`, `wsgi.py`, `asgi.py`, `manage.py`, requirements…), every app's files, and per-model template files.
2. **No project description displayed.** `description` is captured at creation and shown on the dashboard card, but never surfaced in the builder.
3. **No About page.** db4's source has none, but the live `.io` site does. db5 has neither a route nor a link.
4. **Model editor is not responsive.** The three panes are a fixed flex row with hard min-widths; on a narrow viewport they get cramped with no stacking/collapsing.
5. **Nowhere to toggle project settings.** The store exposes `setProjectName / setDjangoVersion / setFlag`, but no UI calls them. Settings are set once at creation and are then permanently frozen.

## Design

Four of the five gaps are really "the builder has no shell." The core move is to **add a builder shell** (header + settings) and make the body **responsive**, plus swap the flat code pane for a **file-tree browser**. The About page is independent.

### Component map

```
BuilderPage
├─ ProjectHeader              NEW — name · description · version/HTMX/Channels chips
│                                   · "Settings" button · "Download .tar"
└─ Builder body (responsive)
   ├─ TreePane (apps → models) existing; collapsible drawer < lg
   ├─ EditorPane (fields/rels)  existing
   └─ CodePane                  REWRITTEN — file tree + rendered file
      ├─ FileTree               NEW — renders projectFileTree(project)
      └─ CodeView               rendered node + Copy (reuses highlight)
```

### 1 — Project files: file-tree browser

- **Core (additive):** export `DjangoProjectFileResource` from `lib/djangobuilder-core/src/index.ts`. It is already public on `./rendering`; the package root just doesn't re-export it. No behavior change; db4 keeps its deep import.
- **db5 `domain/generate.ts`:** add two pure functions built on the existing `buildCoreProject`:
  - `projectFileTree(project: LocalProject): DjangoProjectFile[]` → `renderer.asTree(buildCoreProject(project))`.
  - `renderNodeByPath(project, path): { code, lang, name } | null` → rebuild the core project, `renderer.asFlat(core).find(n => n.path === path)`, switch on `node.type` (`PROJECT_FILE → renderProjectFile`, `APP_FILE → renderAppFile`, `MODEL_FILE → renderModelFile`), return rendered code + language. Rebuilding from the store's `LocalProject` on every call keeps the view live as models change (matches db4).
- **`FileTree` component:** recursive folder/file rows from `projectFileTree`. Folders expand/collapse (local state); files select by `path`. Selected path highlighted. Default selection: the selected app's `models.py`, else the project's `settings.py` (db4's `chooseFileToDisplay` behavior).
- **`CodePane`** holds the selected file `path` in state; renders `FileTree` + a `CodeView` (path label + Copy button + highlighted code from `renderNodeByPath`). Folder folder-icon vs file styling; monospace.
- Languages: `.py → python`, `.html → django`, everything else → plaintext (highlight.js core already has python + django registered). Good enough for parity; the meaningful files are `.py`.

### 2 — Project description + 5 — Project settings

- **`ProjectHeader`** (new, top of `BuilderPage`): project name (bold), description (muted, empty-state "No description"), chips for Django version + HTMX + Channels, a **Settings** button, and the **Download .tar** button (moved up from CodePane — matches db4's top bar). Also hosts the mobile Tree drawer toggle (#4).
- **`ProjectSettingsDialog`** (new): a modal reusing `NewProjectDialog`'s field layout, pre-filled from the current project. Fields: name, description, Django version, HTMX, Channels. A **Save** button commits all fields write-through; **Delete project** in the footer (confirm → `deleteProject` → navigate `/projects`) for db4 parity. Cancel closes.
- **Store:** add `setDescription(description)` (there is `setProjectName` but no description setter). Everything else uses existing actions (`setProjectName`, `setDjangoVersion`, `setFlag('htmx'|'channels')`, `deleteProject`).

### 3 — About page

- New route `/about` (public, outside `Gate`) + `AboutView` + an "About" link in `TopNav`.
- Content ported from the `.io` About: heading, tagline, Django 3/4/5 support line, GitHub links (repo + author), Twitter `@mmc4rdle`, and the donation note with the BTC address + PayPal link. Styled on-brand (dark, accent), self-contained — no external images required (BTC address as text; PayPal as a link/button).

### 4 — Responsive builder layout

- **`lg` and up:** today's row — `TreePane` (fixed `w-56`) · `EditorPane` (`flex-1`) · `CodePane` (`flex-1`).
- **Below `lg`:** `TreePane` collapses to an off-canvas drawer toggled from `ProjectHeader`; `EditorPane` + `CodePane` become a full-width **two-tab switcher** ("Edit" / "Code"). Standard IDE-on-mobile pattern.
- Implemented with Tailwind responsive utilities plus minimal local state in a `BuilderShell` (mobile tab + drawer open). No changes to `EditorPane`/`CodePane` internals beyond layout wrappers.

## Data flow

All reads derive from the store's `project: LocalProject`. The file tree and rendered file are recomputed from `project` on each render (via `buildCoreProject`), so edits in `EditorPane` reflect immediately in the code view — no extra wiring. Settings and description writes go through existing/added store actions → `writes.ts` → Firestore, echoed back through the live `onSnapshot` (same write-through model as M2).

## Error handling

- `renderNodeByPath` returns `null` for an unknown/stale path → `CodeView` shows an empty-state and falls back to the default file. Guards against a selected path disappearing after an app/model rename or delete.
- Settings writes use the existing `guardWrite` (logs failures, no unhandled rejection).

## Testing

Vitest + React Testing Library, TDD per repo convention:

- `generate.test.ts`: `projectFileTree` includes project + app + model nodes; `renderNodeByPath` renders the right file per node type and returns `null` for a bad path.
- `FileTree.test.tsx`: renders folders/files, expands/collapses, fires select with the node path.
- `CodePane.test.tsx`: default selection is the app's `models.py`; selecting a project file (e.g. `settings.py`) renders project-level content; Copy works.
- `ProjectHeader.test.tsx`: shows name + description + chips; Settings opens the dialog; Download triggers.
- `ProjectSettingsDialog.test.tsx`: pre-fills from project; Save calls the store setters; Delete confirms → navigates.
- `AboutView.test.tsx`: renders heading + key links.
- `BuilderShell` responsive: the mobile Edit/Code tab switch and drawer toggle change what's shown (jsdom class/visibility assertions).
- Store: `setDescription` calls `updateProject` with `{ description }`.

## Out of scope (not part of parity gaps)

- Click-to-jump on symbols (explicitly abandoned).
- Editing generated code inline.
- Add-app-with-name / abstract-model / delete-app *from the builder* (db4 has these; not among the five named gaps — track as a later follow-up if wanted).

## Milestone 4 checklist

1. Core: export `DjangoProjectFileResource`.
2. `domain/generate.ts`: `projectFileTree` + `renderNodeByPath` (+ tests).
3. Store: `setDescription` (+ test).
4. `FileTree` component (+ tests).
5. `CodePane` rewrite to tree + `CodeView` (+ tests).
6. `ProjectSettingsDialog` (+ tests).
7. `ProjectHeader` (+ tests).
8. `BuilderShell` responsive layout + wire header/drawer/tabs (+ tests).
9. `AboutView` + `/about` route + `TopNav` link (+ tests).
10. Full suite + lint + build green.
