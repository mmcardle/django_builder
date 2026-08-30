# djangobuilder5 — Docked models editor on very wide screens

**Date:** 2026-07-12
**Goal:** On very wide screens, show the models editor as a **docked side panel beside the live code** instead of a centered overlay modal, so edits and the regenerating code are visible together. Below the breakpoint, keep the modal.

> Decision (user was away during the side question): **right rail** at the **`2xl` (1536px)** breakpoint. Written so the side is a one-line change.

## Design

Same content, two containers chosen by viewport width:

- **`< 1536px`:** the current centered overlay `ModelsModal` (unchanged UX).
- **`≥ 1536px`:** a docked right-rail `<aside>` in the builder row — `[FileTree] [CodeView] [ModelsPanel]` — no dark overlay; the code stays visible and regenerates as you edit.

### Refactor

- **Extract `ModelsPanel`** (new): the editor *content* currently inside `ModelsModal` — header (title · Import · Delete app · Close ✕), scrollable body (`ModelEditor` per model + empty state + ＋ Add model), footer (Done), the Import dialog, the delete-app confirm, and the "close if the app vanished" effect. Renders as `flex h-full flex-col` (header/footer `shrink-0`, body `flex-1 overflow-y-auto`). Props `{ appId, onClose }`.
- **`ModelsModal`** becomes a thin overlay wrapper: `fixed inset-0 bg-black/60` + a `max-w-2xl max-h-[85vh] flex flex-col` card containing `<ModelsPanel>` (backdrop click / stopPropagation preserved).
- **`useMediaQuery(query)`** (new, `src/lib/`): `matchMedia`-based hook, SSR/jsdom-safe. `src/test/setup.ts` gains a `matchMedia` mock so component tests are unaffected.
- **`BuilderShell`**: `const wide = useMediaQuery("(min-width: 1536px)")`. When `editingAppId`:
  - `wide` → render `<aside className="flex w-[34rem] shrink-0 flex-col border-l border-border bg-surface">` **after `CodeView` inside the row** (right rail) holding `<ModelsPanel>`.
  - `!wide` → render `<ModelsModal>` overlay (as today).
  - Left-rail variant = move the `<aside>` before `CodeView`.

`ImportModelsDialog` stays a `fixed inset-0 z-40` overlay in both modes (it covers everything while importing) — no change.

## Data flow / behaviour

Unchanged: all edits are write-through; the docked panel and the code both derive from the store, so the code regenerates live while the panel is open. Opening (tree ✎ / code "Edit models") and closing (✕ / Done) toggle the same `editingAppId`.

## Testing

- `useMediaQuery.test`: reflects `matchMedia().matches` and updates on change events.
- `BuilderShell.test`: with the hook mocked **false** + editing → the modal renders; mocked **true** + editing → the docked `ModelsPanel` renders and the modal does not. Drawer/tab tests unchanged.
- `ModelsModal.test`: unchanged — still exercises the content (now via `ModelsPanel`) through the modal wrapper.
- Add `matchMedia` mock to `src/test/setup.ts`.

## Out of scope

- Resizable/draggable panel width; remembering open state across reloads; a manual dock/undock toggle. (Width is fixed `34rem`.)

## Build order

1. `useMediaQuery` + test-setup `matchMedia` mock. 2. Extract `ModelsPanel`; slim `ModelsModal`. 3. Wire `BuilderShell` (right rail on `2xl`). 4. Tests + tsc + lint + build + live check.
