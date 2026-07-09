# djangobuilder5 — Django 6 version option

**Date:** 2026-07-09
**Goal:** Offer Django **6** (pinned `6.0`) as a project version in db5, and make it the new default.

## Context

Versions are enum-driven end to end. The shared core (`lib/djangobuilder-core/src/types.ts`) defines the version *as* the enum value: `DJANGO3 = 3.2`, `DJANGO4 = 4.1`, `DJANGO5 = 5.1`. The generator has **no** version-conditional logic — the number only flows into `requirements.txt` (`Django=={{project.version}}`) — so adding a version is purely additive. db5 maps its local `3|4|5` to those numbers and lists them as `<option>`s.

## Design

1. **Core** `types.ts`: add `DJANGO6 = 6.0` to the `DjangoVersion` enum. Additive; db4 is unaffected (it simply won't list it until updated). Core's `DEFAULT_DJANGO_VERSION` is unused by db5 and left alone.
2. **db5** `domain/firestore/version.ts`:
   - `DjangoVersionNumber = 3 | 4 | 5 | 6`.
   - `toVersionNumber(6) → 6.0`.
   - `fromVersion`: a stored `6…` maps to `6`; the fallback default becomes **6** (was 5).
3. **db5** `domain/buildCoreProject.ts`: `toDjangoVersion(6) → DjangoVersion.DJANGO6`.
4. **Dialogs**: prepend `<option value={6}>Django 6</option>` to `NewProjectDialog` and `ProjectSettingsDialog`, and make **6 the preselected default** (`useState<DjangoVersionNumber>(6)` in New-project; `project?.djangoVersion ?? 6` in Settings).

New projects therefore default to Django 6, pinning `Django==6.0` in `requirements.txt`; existing projects keep their stored version.

## Testing

- `version.test`: `toVersionNumber(6) === 6.0`; `fromVersion(6.0) === 6`, `fromVersion("6") === 6`, `fromVersion(undefined) === 6` (new default).
- `buildCoreProject.test`: a project with `djangoVersion: 6` builds a core project whose version is `6.0` (`DjangoVersion.DJANGO6`).
- Existing version tests updated where they asserted the old default of 5.

## Out of scope

- No Django-6-specific template changes (the generator is version-agnostic beyond the pin).
- No change to core's `DEFAULT_DJANGO_VERSION` or to db4.
- Marketing copy (splash chip / About "supported versions") left unchanged unless requested.
