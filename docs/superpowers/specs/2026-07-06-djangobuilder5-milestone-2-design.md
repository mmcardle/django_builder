# Spec: `djangobuilder5` — Milestone 2 (Auth + Firestore persistence + Projects dashboard)

Date: 2026-07-06

## Goal

Turn `packages/djangobuilder5` from a local-only builder into a real, multi-user,
persistent app on the **same Firebase backend and Firestore schema as the live app**,
so a signed-in user sees their existing projects and anything they build in db5 also
opens in the live app. M2 adds authentication, a projects dashboard, and a
Firestore-backed builder that auto-saves.

This builds directly on Milestone 1 (React + Vite + TS + Tailwind v4 + shadcn, the
three-pane builder, the design system) — see
`docs/superpowers/specs/2026-07-05-djangobuilder5-ui-redesign-design.md`.

## Decisions (agreed)

- **Share the live data.** db5 points at the same Firebase project (dev:
  `django-builder-dev`; prod: `django-builder-productio-6c3ca`) and the same five
  flat, owner-stamped collections (`projects`, `apps`, `models`, `fields`,
  `relationships`). A mapper bridges db5's nested `LocalProject` to the flat schema.
- **Auto-save write-through.** Opening a project hydrates the store from a live
  `onSnapshot` listener; every builder edit writes through to Firestore immediately
  (text inputs debounced ~400ms). No Save button; no lost work; interoperable and
  multi-tab consistent. Mirrors the live app.
- **Full email auth + anonymous.** Sign in, sign up, password reset, the
  email-verification gate + action-code handling (`?mode=verifyEmail|resetPassword`),
  and anonymous "try it". GitHub deferred (it is disabled even in production).
- **Dashboard = cards with a code-preview thumbnail ("A + C").** Each project card
  shows a small syntax-highlighted `models.py` snippet plus metadata (Django version,
  app/model counts, feature chips, last edited), create/open/delete, and a "New
  project" tile.
- **Keep `MAX_PROJECTS = 3`.** The live app's per-user cap is retained as a
  client-side guard in the new-project flow (the Firestore rules do not enforce it).
- **Modular Firebase SDK** (`firebase ^11`), mirroring `packages/djangobuilder4/src/firebase.ts`.
- **Drop `postgres`.** db5's M1-only `LocalProject.postgres` field has no Firestore
  equivalent (core defaults it); it is removed from the local type in M2.

## Non-goals (→ M3)

- GitHub auth; the canvas/ERD view; project duplicate; real screenshot thumbnails;
  production routing/deploy changes beyond M1's `/db5/` wiring; migrating the live app
  off Vue.

## The data-compatibility contract (must honor exactly)

Grounded in `packages/djangobuilder.io/src/store.js`, `packages/djangobuilder4/src/firebase.ts`,
and `firestore.rules`:

- **Five flat top-level collections**, no nesting. Parent→child links are maps
  `{childId: true}` stored on the PARENT doc; children have **no back-pointer**.
- **Every document carries `owner: <current uid>`.** Security rules allow
  read/update/delete/list only when `request.auth.uid == resource.data.owner`, and
  create for any signed-in user — so `owner` MUST be set on create or the doc becomes
  unreadable. Every query MUST filter `where("owner","==",uid)`.
- **Document field sets** (write exactly these, defaulting as the primary `.io` app does):
  - project: `{ owner, name, description, channels:bool, htmx:bool, django_version, apps:{} }`
  - app: `{ owner, name, models:{} }` — and set `projects/{pid}.apps[appId] = true`
  - model: `{ owner, name, abstract:bool, parents:[], fields:{}, relationships:{} }` — and set `apps/{aid}.models[modelId] = true`
  - field: `{ owner, name, type, args }` (args default `""`) — and set `models/{mid}.fields[fieldId] = true`
  - relationship: `{ owner, name, to, type, args }` (args default `""`) — and set `models/{mid}.relationships[relId] = true`
- **`django_version` is `3.2 | 4.1 | 5.1`** (the `DjangoVersion` enum value), NOT `3|4|5`.
  Stored as a number by `.io`, a string by db4; readers tolerate either via
  `String(v).startsWith(...)`. db5 writes the number `3.2/4.1/5.1` and maps back to
  `3|4|5` for its `LocalProject`.
- **`parents`** is an array of `{type:"django", class:"<dotted.path>"}` and/or
  `{type:"user", app, model}`. M2 preserves parents on read/write but does not add a
  parents-editing UI (deferred); new models write `parents:[]`.
- **`field.type`** = FieldTypes key (`"CharField"`…); **`relationship.to`** =
  `"auth.User"` or `"<app>.<Model>"`; **`relationship.type`** =
  `"ForeignKey"|"OneToOneField"|"ManyToManyField"`.
- **Default fields:** a new model gets `created` (`DateTimeField`,
  `auto_now_add=True, editable=False`) and `last_updated` (`DateTimeField`,
  `auto_now=True, editable=False`), matching `store.js` `addDefaultFields`.
- **Cascade delete:** deleting a project deletes its descendant apps/models/fields/
  relationships in a batch (gather ids first), using the correct `relationships`
  collection name (db4's `getDeleteBatch` has a singular-name bug to avoid).
- **Projects index:** the `projects` query `where owner == … orderBy name` needs the
  existing composite index in `firestore.indexes.json` (already present).

## Architecture

### Layers (only `src/domain/firestore/` and `src/lib/firebase.ts` touch Firebase)
- `src/lib/firebase.ts` — modular init from `import.meta.env.VITE_FIREBASE_*`; exports
  `app`, `auth`, `db`. `browserLocalPersistence` (db5 keeps users signed in across
  sessions; the live db4 uses session-only — db5 chooses local for better UX).
- `src/domain/firestore/mapper.ts` — **pure**, no Firebase imports:
  - `flattenProject(local, owner) → { project, apps[], models[], fields[], relationships[] }`
    (owner-stamped docs + `{id:true}` parent maps + `3.2/4.1/5.1`).
  - `renestProject(flatDocs) → LocalProject` (re-nest by walking the parent maps; map
    version back to `3|4|5`; preserve `parents`).
  - `toDjangoVersionNumber(3|4|5) → 3.2|4.1|5.1` and inverse.
- `src/domain/firestore/projects.ts` — CRUD + subscriptions over the 5 collections
  (mirrors db4 `firebase.ts`): `subscribeUserProjects(uid, cb)`,
  `subscribeProject(uid, projectId, cb)`, `createProject`, `deleteProjectCascade`,
  `addApp/addModel/addField/addRelationship/update*/remove*/moveModelToApp` — each
  writing the child doc AND the parent map in one batch/operation.
- `src/domain/firestore/auth.ts` — `signIn`, `signUp`, `signOutUser`,
  `sendReset`, `resendVerification`, `signInAnon`, `applyVerify(oobCode)`,
  `confirmReset(oobCode, pw)`, `onAuth(cb)`, `isVerified(user)` (github OR emailVerified
  OR anonymous).

### State
- `src/store/authStore.ts` — `{ user, loaded }`; set from `onAuth`. `loaded` gates the app.
- `src/store/projectStore.ts` — **refactored** from M1: holds the current
  `LocalProject` + selection (unchanged shape), but is hydrated by a Firestore
  subscription and each mutating action calls the matching `projects.ts` write. A
  `useProjectSubscription(projectId)` hook wires `subscribeProject → renest → setState`
  and returns an unsubscribe. Debounce text writes ~400ms.
- `src/store/dashboardStore.ts` (or a hook) — subscribes to the user's projects for
  the dashboard grid.

### Screens
- `src/features/auth/` — `LoginView`, `SignUpView`, `ResetPasswordView`,
  `ActionView` (dispatches `verifyEmail`/`resetPassword` by `?mode`),
  `UnverifiedView`. Shared themed form primitives.
- `src/features/dashboard/` — `DashboardView` (grid), `ProjectCard` (code thumbnail via
  `renderAppPreview` + metadata + delete), `NewProjectCard`/dialog (name, description,
  Django version, HTMX/Channels toggles; enforces `MAX_PROJECTS`).
- `src/features/builder/` — reused M1 panes; `BuilderPage` now takes `:id`, mounts the
  project subscription, and shows a loading state until hydrated.

### Routing + gate (`src/app/App.tsx`)
- Public: `/` (Splash), `/login`, `/signup`, `/reset`, `/action`.
- Gated (require a signed-in user): `/projects` (Dashboard), `/project/:id` (Builder).
- App shows a spinner until `authStore.loaded`. Unverified non-anonymous users are
  routed to `/unverified` (except the action route). Verified users hitting `/login`
  go to `/projects`. "Start building — free" → `signInAnon()` → `/projects`.

## Error handling

- `onSnapshot` permission errors right after sign-out are swallowed when
  `auth.currentUser` is null (matches `snapShotErrorHandler`); otherwise surfaced.
- Auth calls surface Firebase error codes as friendly inline messages (wrong password,
  email in use, weak password, too many requests).
- Write failures show a non-blocking toast; the live listener remains the source of
  truth so the UI self-heals on the next snapshot.

## Testing

Per `docs/how-to-write-tests.md`, Vitest + RTL. Layers:
- **Mapper (highest value, pure):** round-trip `flatten → renest` returns an equal
  `LocalProject`; owner stamped on every doc; parent maps correct; `3|4|5 ↔ 3.2/4.1/5.1`;
  `parents` preserved; default `args`/`abstract`. No Firebase.
- **Service layer (`projects.ts`/`auth.ts`):** integration tests against the **Firebase
  emulator** (already configured in `firebase.json`: firestore:8080), behind a dedicated
  script (e.g. `test:emulator`) so the default `test_v5` stays emulator-free and CI-safe.
  Cover: create→read-back a project, cascade delete removes all descendants, owner
  isolation (a second uid can't read the first's docs).
- **Stores/components:** with a mocked firebase service — auth gate/redirects, dashboard
  renders cards from a fake project set + enforces `MAX_PROJECTS`, builder edit calls the
  right `projects.ts` write.

State db5 coverage explicitly; do not claim emulator coverage in the default suite.

## Verification

- `bun run lint_v5`, `bun run --filter=djangobuilder5 type-check`, `bun run test_v5`.
- Emulator suite: `firebase emulators:exec --only firestore "bun run --filter=djangobuilder5 test:emulator"` (or equivalent).
- Manual against `django-builder-dev`: sign up → verify → dashboard shows existing
  projects → open one → edit a field → confirm it persists (reload) and shows in the
  live app → create/delete a project → anonymous "try it" → sign out.

## Risks & mitigations

- **Writing to shared/live data.** Mitigation: develop and test against
  `django-builder-dev` (the existing `.env.development.local`), never prod, until signed
  off. The emulator suite exercises rules/CRUD with zero real-data risk.
- **Write amplification from per-keystroke edits.** Mitigation: debounce text writes;
  non-text actions (add/remove/select, type change) write immediately.
- **Store refactor regressing M1 behavior.** Mitigation: keep the `LocalProject` shape
  and action names identical; only the persistence side changes, so M1 builder tests
  largely still apply.
- **Mapper drift from the live schema.** Mitigation: the mapper is the single, pure,
  well-tested bridge; the contract above is its spec.
- **db4's known bugs** (singular `relationship` cascade, shallow `.io` project delete):
  explicitly avoided — db5 cascades correctly.

## Milestone map

- **M1 (done):** design system + shell + splash + three-pane builder, local state.
- **M2 (this spec):** Firebase auth + Firestore persistence + projects dashboard;
  builder auto-saves to the shared backend.
- **M3:** canvas/ERD view; GitHub auth; project duplicate; deploy/hosting polish;
  optional Radix-backed components.
