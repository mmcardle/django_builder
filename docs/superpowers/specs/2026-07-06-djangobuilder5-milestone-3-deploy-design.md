# Spec: `djangobuilder5` — Milestone 3 (Deploy for real + M2 review minors)

Date: 2026-07-06

## Goal

Ship the redesigned app (M1 + M2) to a live Firebase-hosted domain under `/db5/`,
starting with the **development** environment, and clean up the deferred M2
review minors first so what goes live is solid. This makes the redesign real —
usable next to the existing app at `/` and `/db4/`.

## Decisions (agreed)

- **Development first.** Deploy to `django-builder-dev` and verify the live
  `/db5/` end-to-end. Staging and production are a separate, later go-ahead.
- **The agent runs the dev deploy** (the Firebase CLI is authenticated as the
  owner) and reports the live URL. The prod gate stays with the user.
- **Inline execution** (this session, with review) rather than the subagent
  fleet — the change set is small.
- **Scope = subpath deploy fixes + the four M2 review minors**, then deploy +
  live verification.

## Non-goals (later)

Staging/production deploy; GitHub auth; project duplicate; the canvas/ERD view;
Radix-backed components. No changes to the `.io` or `db4` apps.

## Changes

### A. Subpath correctness (required for a working deployed `/db5/`)

1. **Auth action-code continue URL** — `src/domain/firestore/auth.ts`
   `verifyActionSettings` currently returns `{ url: \`${window.location.origin}/login\` }`.
   Change to include the app base so verified/reset users return to the db5 app:
   `{ url: \`${window.location.origin}${import.meta.env.BASE_URL}login\` }`.
   `import.meta.env.BASE_URL` is `/` in dev and `/db5/` in the deployed build, so
   this is correct in both (dev → `/login`, deployed → `/db5/login`). Applies to
   both `signUp` and `resendVerification`.

2. **Favicon** — add an inline SVG data-URI favicon `<link rel="icon" …>` to
   `packages/djangobuilder5/index.html` to remove the 404 (an emerald "db" glyph).

### B. M2 review minors

3. **`snapshotErrorHandler`** — `src/lib/firebase.ts`. Today: `if (auth.currentUser) throw error;`.
   Throwing inside an `onSnapshot` error callback is uncaught. Change to **log,
   not throw**, when signed in, and stay silent right after sign-out:
   ```ts
   export function snapshotErrorHandler(error: unknown): void {
     if (auth.currentUser) console.error("[db5] snapshot error", error);
   }
   ```
   (The `queryToResult`-style empty-return path does not exist in db5's `data.ts`;
   only the `onSnapshot` error callback uses this, so a void log is sufficient.)

4. **All-collections-loaded guard** — `src/domain/firestore/data.ts` +
   `src/store/projectStore.ts`. Today `dataLoaded` flips true on the FIRST
   collection's first snapshot, so a delete/auto-select can race the other
   collections. Change `subscribeAll` to also report readiness: it tracks a
   `Set<collection>` of collections whose initial snapshot has arrived and passes
   an `allLoaded` boolean to `onData(data, allLoaded)` (true once all 5 are in).
   The store's `start()` sets `dataLoaded: allLoaded`. This fixes the
   cascade-delete window, the "Project not found" flash, and makes first-model
   auto-select reliable (models are present before `dataLoaded`).

5. **`UnverifiedView` refresh** — add `reloadUser()` to `auth.ts`
   (`auth.currentUser?.reload()` then return `auth.currentUser`). The view's
   button calls it, pushes the refreshed user into the auth store
   (`useAuthStore.getState().setUser(user)`), and if `isVerified(user)` navigates
   to `/projects` — no manual page reload. (Firebase does not fire
   `onAuthStateChanged` on an `emailVerified` change, so the explicit
   reload+setUser is required to update the gate.)

6. **`addModel` atomicity** — `src/domain/firestore/writes.ts`. Replace the four
   sequential awaited writes with a single `writeBatch`: allocate client-side doc
   refs via `doc(collection(db, "models"))` / `doc(collection(db, "fields"))`,
   `batch.set` each doc, `batch.update` the parent maps
   (`apps/{appId}.models.{modelId}=true`, `models/{modelId}.fields.{fieldId}=true`
   for both default fields), and `commit()` once. Atomic; one round-trip.

### C. Deploy to development

Run `make deploy name=development` from the repo root. It:
`bunx firebase use development` → `bun run build_development` (io + v4 + **v5**,
each `--mode=development`; v5 with `--base=/db5/`) → assembles `dist_development/`
with `db4/` and `db5/` subdirs → `bunx firebase deploy --public=dist_development`
to `django-builder-dev` (hosting + the shared Firestore rules/indexes from
`firebase.json`). Publishes the whole site: `.io` at `/`, `/db4/`, and `/db5/`.

### D. Verify on the live dev domain

Load `https://django-builder-dev.web.app/db5/` and smoke-test on the real host:
splash → anonymous sign-in → dashboard → create a project → add app/model →
reload (persistence) → and confirm a direct `/db5/…` deep link resolves through
the Firebase `db5/** → /db5/index.html` rewrite. Capture a screenshot.

## Testing

Vitest, updating the affected suites:
- `snapshotErrorHandler` — logs (spy) when a currentUser exists, no-throw when signed out.
- `subscribeAll` — `onData` reports `allLoaded=false` until all 5 collections'
  initial snapshots arrive, then `true`; `projectStore` sets `dataLoaded`
  accordingly (update `data.test.ts` + `projectStore.test.ts` for the new signature).
- `writes.addModel` — asserts a single `writeBatch` with the model + app-map +
  two default fields + one `commit()`.
- `reloadUser` — calls `auth.currentUser.reload()`.
- Whole `test_v5` suite stays green; `type-check`, `lint`, `build` clean.

## Risks & mitigations

- **Dev project may not have Firebase Hosting enabled.** Mitigation: if
  `firebase deploy` errors on hosting, report it rather than force-enabling
  anything; the code fixes still land and staging/prod remain options.
- **Deploy publishes `.io` + `db4` to dev too** (the whole assembled site). This
  is expected (same as how `/db4/` ships) and dev is low-risk.
- **`allLoaded` change alters `dataLoaded` timing** — covered by updating the two
  affected tests; the store's derived `project`/`summaries` are unaffected (they
  recompute from `data` regardless of the flag).
- **The email action handler is a single project-wide setting** shared with
  `.io`/`db4`; email links route through the existing handler. db5 only owns the
  *continue* URL (fix #1) and its own `/db5/action` fallback. Not changed here.

## Milestone map

- M1 (done): design system + builder, local state.
- M2 (done): auth + Firestore persistence + dashboard.
- **M3 (this spec):** deploy to development under `/db5/` + M2 review minors.
- Later: staging/prod deploy; GitHub auth; project duplicate; canvas/ERD; Radix.
