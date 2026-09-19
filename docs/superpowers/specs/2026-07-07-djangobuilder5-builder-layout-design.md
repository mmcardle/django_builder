# djangobuilder5 — Builder Layout (Option A: Tabbed Workspace)

**Date:** 2026-07-07
**Goal:** Replace the cramped four-column builder with a two-column tabbed workspace.

## Problem

The Milestone-4 file-tree work left the builder showing four columns side by side at desktop width:

```
[ Models tree ] [ Editor ] [ File tree ] [ Code ]
```

Two navigation trees (the apps→models tree and the generated-file tree) and two content panels (the model editor and the code view) all compete for horizontal space, so each is narrow. The two trees also present two competing navigation metaphors at once.

## Decision

**Option A — tabbed workspace** (chosen via visual mockup). Keep the models tree as the single persistent left sidebar; make the main area a tab switcher between **Design** (the model editor) and **Code** (the file tree + generated code). You never see both content panels at once, so nothing is cramped, and switching is one click.

```
Design tab:  [ Models tree ] [ ─ Design | Code ─  model editor, full width ]
Code tab:    [ Models tree ] [ ─ Design | Code ─  file tree + code, full width ]
```

- **Design tab:** two columns — models tree + `EditorPane`.
- **Code tab:** the models tree stays put; the main area is `CodePane` (its existing internal `FileTree` + code view). Three columns total, but the code area is wide because the editor is hidden. The models tree deliberately stays persistent so it doesn't jump when switching tabs.

This is the same tab pattern the builder already uses on narrow screens — Option A simply makes it the pattern at **every** breakpoint, which also unifies desktop and mobile behaviour.

## Changes

Almost entirely inside `BuilderShell.tsx`; `EditorPane`, `CodePane`, `FileTree`, `ProjectHeader`, and `TreePane` are unchanged.

- **`BuilderShell`:** today the Editor/Code wrappers carry `lg:flex`, which forces them side-by-side on large screens (the source of the 4-column squeeze). Remove `lg:flex` so the active tab governs visibility at **all** widths. Show the tab bar at all widths (drop its `lg:hidden`). The persistent-tree-on-`lg` / drawer-below-`lg` behaviour is unchanged.
- **Tab labels:** rename `Edit` → **Design**; keep **Code**. Default tab: **Design**.
- No data-flow changes: tab state stays local to `BuilderShell`; the model-tree drawer's `onNavigate` still closes the drawer and resets to the Design tab.

## Data flow / error handling

Unchanged from Milestone 4. `EditorPane` and `CodePane` still read the store and recompute from `project`. No new persistence, no new failure modes.

## Testing

Update `BuilderShell.test.tsx`:

- Default tab is **Design**; the Code pane is hidden until selected — assert at a **desktop** width too (the previous test implicitly relied on mobile-only tabs).
- Clicking **Code** hides the editor wrapper and shows the code wrapper; clicking **Design** reverses it — at all widths (no `lg:flex` escape hatch anymore).
- Tab labels read "Design" and "Code".
- Drawer open/close via the header toggle and scrim still works (unchanged behaviour, keep the test).

`EditorPane`, `CodePane`, `FileTree`, `ProjectHeader` tests are unaffected.

## Out of scope

- Option B (file-picker dropdown) and Option C (unified file tree) — not chosen.
- Any change to `EditorPane` / `CodePane` internals, the file tree, or the project header.
- Hiding the models tree in Code mode (kept persistent by decision).

## Checklist

1. `BuilderShell`: remove `lg:flex`, always-visible tab bar, `Design`/`Code` labels, default `Design`.
2. Update `BuilderShell.test.tsx` for tabs-at-all-widths + labels.
3. Full suite + lint + typecheck + build green.
4. Verify live in the browser (desktop + narrow).
