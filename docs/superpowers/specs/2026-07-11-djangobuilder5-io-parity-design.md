# djangobuilder5 — Parity with djangobuilder.io (High + Medium)

**Date:** 2026-07-11
**Goal:** Close the High- and Medium-impact feature gaps between db5 and the production `djangobuilder.io` app, staying data-compatible (db5 shares the live Firestore).

## Features

### 1. Import from `models.py` (High)

Port `.io`'s import flow to db5's modal.

- Core already ships `ModelImporter`: `new ModelImporter().import_models([text]) → [{ text, models: DjangoModel[], errors: string[] }]`. Each parsed `DjangoModel` has `name`, `abstract`, `fields[]` (name/type/args), `relationships[]` (name/type/to/args).
- **`domain/import.ts`** (new, pure): `parseModelsPy(text): { models: ParsedModel[]; errors: string[] }` wrapping `ModelImporter`, converting core `DjangoModel`s → plain `ParsedModel` (`{ name, abstract, fields:[{name,type,args}], relationships:[{name,type,to,args}] }`).
- **`writes.importModels(user, appId, models: ParsedModel[])`**: one `writeBatch` — for each model create a model doc (+ its fields/relationships docs, owner-stamped) and link it into the app's `models` map. Reuses the same shapes as `addModel`/`addField`/`addRelationship`. (No default created/last_updated fields — imported models come as-authored.)
- **`store.importModels(appId, models)`** → `guardWrite(fs.importModels(user, appId, models))`.
- **`ImportModelsDialog`** (new): a textarea to paste `models.py` (or upload a file into it) → Parse → preview a checkbox list of parsed models (name + field/rel counts, errors shown) → "Add selected" → `importModels`. Opened from an **"Import"** button in `ModelsModal`'s header.

### 2. Model inheritance / parents (High)

- **Data format (matches `.io`, shared Firestore):** `models.parents` is an array of `{ class: string, type: "django" }` (built-in base, `class` = full path e.g. `django.contrib.auth.models.User`) or `{ app: appId, model: modelId, type: "user" }` (user-model parent).
- **`LocalModel.parents: LocalParent[]`** (`domain/types.ts`), where `LocalParent = { type: "django"; class: string } | { type: "user"; app: string; model: string }`.
- **`mapper.renestProject`**: read `models[id].parents ?? []` into `LocalModel.parents` (filter dangling user parents whose app/model no longer exist).
- **`buildCoreProject`**: resolve parents and pass as the **5th** `addModel` arg. django → the `BuiltInModelTypes` value whose `.model === class.split('.').pop()`; user → the core model built for that `{app,model}` id. Resolve in a second pass (like relationships) so user-parent targets already exist.
- **Store**: `setModelParents(appId, modelId, parents: LocalParent[])` → `fs.updateModel(modelId, { parents })`.
- **UI** (`ModelEditor`): a "Parents" row — current parents as removable chips + an add control (a `Select` listing built-in bases `auth.User / auth.AbstractUser / auth.AbstractBaseUser / auth.Group` and every *other* user model `app.Model`). Selecting appends to `parents` (django built-ins as `{type:"django",class:fullPath}`; user models resolved to `{type:"user",app,model}`).

### 3. Move model between apps (High)

- **`writes.moveModel(fromAppId, toAppId, modelId)`**: one batch — `apps.<from>.models.<id> = deleteField()`, `apps.<to>.models.<id> = true`. The model/field/relationship docs are unchanged (owner-stamped, still valid).
- **`store.moveModel(fromAppId, toAppId, modelId)`**.
- **UI** (`ModelEditor` header): a "Move to…" `Select` of the project's *other* apps → `moveModel`. (Relationship `to` strings referencing the old `app.Model` are left as-is — same pre-existing rename caveat.)

### 4. Anonymous → registered upgrade (High)

- **`auth.upgradeAnonymous(email, password)`**: `linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))` then `sendEmailVerification(user, verifyActionSettings())`. Same uid → all data preserved. Returns the upgraded `User`.
- **`UpgradeAccountDialog`** (new): email + password form → `upgradeAnonymous` → push updated user to `authStore` → success message ("check your email to verify").
- **Entry point**: when `user.isAnonymous`, show a **"Save your account"** button in `TopNav` (replacing the anonymous nothing-state) that opens the dialog.

### 5. Extra built-in relationship/parent targets (Medium)

- **`options.ts` `relationshipTargets`**: prepend the full built-in set `["auth.User", "auth.AbstractUser", "auth.AbstractBaseUser", "auth.Group"]` before the user models.
- **`buildCoreProject`** relationship resolution: generalize `rel.to === "auth.User" ? …` to `BuiltInModelTypes[rel.to] ?? modelIndex.get(rel.to)` so any built-in target renders.
- A shared `builtInTargets` constant (derived from core `BuiltInModelTypes`) reused by relationships **and** parents (#2).

### 6. Analytics + cookie consent + Privacy Policy (Medium)

- **`store/consentStore.ts`**: `{ analytics: boolean | null }` persisted in `localStorage` (`null` = undecided). Actions `accept()` / `decline()`.
- **`lib/analytics.ts`**: `initAnalytics()` — if consent granted **and** `import.meta.env.VITE_GA_ID` is set, inject `gtag.js` and configure; otherwise no-op. `trackEvent(name, params)` guarded by consent. Wired to fire a lightweight event on project download (parity with `.io`).
- **`ConsentSnackbar`** (new): shown while consent is `null` — "We use cookies for analytics" + Accept / Decline + a link to the privacy policy.
- **`PrivacyPolicy`** (new): a `/privacy` route + a "Privacy" link in `TopNav`/About describing data use (Firebase, analytics, contact). Content ported/adapted from `.io`'s privacy dialog.

## Cross-cutting / data flow

All writes stay write-through (Firestore → `onSnapshot` echo). New model-level writes (`parents`, `moveModel`, `importModels`) go through `guardWrite`. The parents/target built-ins come from one shared source of truth derived from core `BuiltInModelTypes`.

## Testing (Vitest + RTL, TDD)

- `import.test`: `parseModelsPy` parses a sample `models.py` into models/fields/relationships + surfaces errors.
- `writes.test`: `importModels` batches models+fields+rels+app links; `moveModel` flips the two app-map keys; `updateModel` accepts `parents`.
- `store.test`: `importModels`, `moveModel`, `setModelParents` delegate correctly.
- `buildCoreProject.test`: a model with a django parent and a user parent builds with resolved core parents; a relationship to `auth.Group` renders.
- `mapper.test`: parents round-trip; dangling user parents filtered.
- `ModelEditor.test`: parents add/remove; move-to-app select.
- `ImportModelsDialog.test`: paste → parse → select → importModels called.
- `UpgradeAccountDialog.test` + `auth` mock: upgrade calls link + verification.
- `ConsentSnackbar.test`: accept/decline update the store; hidden once decided.
- `options.test` (or existing): `relationshipTargets` includes the four built-ins.

## Out of scope (Low items, per the goal)

Per-app model cap, in-builder project switcher, illustrated splash, PWA manifest, footer/version, `/debug`. Also unchanged: Meta options / custom methods / nameField editing (exposed by none), DRF/Postgres toggles, GitHub OAuth (dormant everywhere).

## Build order

1. #5 built-in targets (foundation reused by #2). → 2. #2 parents. → 3. #3 move model. → 4. #1 import. Done by me (shared data-model files). In parallel: **#4 anon-upgrade** and **#6 analytics/consent/privacy** (isolated) via subagents. Then full suite + tsc + lint + build + live verification on :8081.
