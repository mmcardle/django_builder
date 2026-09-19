# djangobuilder5 — Roomier field/relationship args editing

**Date:** 2026-07-12
**Goal:** Make field and relationship **arguments** easy to read and edit (they're cramped to a sliver in the docked panel), expose **relationship args** (currently not editable at all), and ensure long args **word-wrap** instead of being clipped.

## Problem

In `ModelEditor`, a field row is `name · type · args · ✕` on one line; the `args` input is `flex-1` and shrinks to almost nothing in the narrow docked panel. Relationship rows are `name · type · target · ✕` with **no args field**, so `on_delete=…`, `related_name=…` etc. can't be edited even though the data carries them. Long args in a single-line `<input>` don't wrap — they scroll out of view.

## Design (Approach A + word-wrap)

Give args their own **full-width line** below the controls, as a wrapping textarea:

```
FIELDS
  [ name          ] [ CharField ▾ ]                 ✕
  [ max_length=200                              …  ]   ← full-width, wraps

RELATIONSHIPS
  [ author        ] [ ForeignKey ▾ ] [ auth.User ▾ ] ✕
  [ on_delete=models.CASCADE, related_name="posts" ]   ← NEW, full-width, wraps
```

- **`DebouncedTextarea`** (new, `components/ui/`): mirrors `DebouncedInput`'s debounce + focused-ref + unmount-cancel behaviour, but renders a `<textarea>` that **soft-wraps** (`whitespace-pre-wrap`, `resize-none`) and **auto-grows** to fit its content (min ~1 line). **Enter is suppressed** (`onKeyDown` preventDefault + commit) so args stay a single logical line — no stray newlines break the generated code.
- **`ModelEditor` field block** → two rows: line 1 `name` + `type` + `✕`; line 2 the args `DebouncedTextarea` (full width), committing via `updateField(...{ args })`.
- **`ModelEditor` relationship block** → two rows: line 1 `name` + `type` + `target` + `✕`; line 2 the args `DebouncedTextarea` (full width), committing via `updateRelationship(...{ args })` — **this is new editing capability**.
- Line 1 (controls) keeps the existing `min-w-0 flex-1` shrink fixes; args on its own line removes the horizontal squeeze entirely.

## Data flow

Unchanged write-through: args commit (debounced, on blur, newline-stripped) → `updateField`/`updateRelationship` → Firestore → live code regen. Relationship args already flow through `buildCoreProject` (`rel.args`); we're only adding the UI to edit them.

## Testing

- `DebouncedTextarea.test`: commits after debounce/on blur; Enter does not insert a newline (value has no `\n`); adopts external value only while unfocused.
- `ModelEditor.test`: editing a field's args (textarea) calls `updateField` with `{ args }`; a **relationship** now exposes an args editor whose edit calls `updateRelationship` with `{ args }`. Keep existing field/relationship/parent/move tests.

## Out of scope

- Structured key=value arg editor and per-type arg suggestions (option C) — deferred.
- Click-to-expand rows (option B).
