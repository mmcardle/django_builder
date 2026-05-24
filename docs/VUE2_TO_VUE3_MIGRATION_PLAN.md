# djangobuilder.io: Vue 2 → Vue 3 / Vuetify 2 → 3 Migration Plan

> Status: **planned, not started**. This document captures the work needed to
> migrate `packages/djangobuilder.io` off Vue 2 + Vuetify 2 onto Vue 3 +
> Vuetify 3 so it can stay on a supported toolchain alongside
> `packages/djangobuilder4`.
>
> The repo already contains a Vue 3 app (`djangobuilder4`). The medium-term
> goal of this migration is to either:
>
> 1. Bring `djangobuilder.io` to Vue 3 / Vuetify 3 and keep both apps, **or**
> 2. Retire `djangobuilder.io` once `djangobuilder4` reaches feature parity.
>
> The plan below assumes path (1) — a true migration — and notes where path
> (2) would be cheaper.

## Why this is a separate project

Vue 2 reached End of Life on **2023-12-31** and Vuetify 2 reached EOL on
**2025-01-23**. They no longer receive security or compatibility fixes, and a
growing number of tools in the ecosystem (Vite ≥ 5, Vitest ≥ 1, jsdom ≥ 21,
@vue/test-utils ≥ 2, unplugin-vue-components recent majors, eslint-plugin-vue
≥ 10, …) have dropped Vue 2 support. That is why our recent dependency
refresh deliberately left the Vue-2 toolchain pinned in
`packages/djangobuilder.io`:

| Package                       | Current pin (Vue 2) | Vue 3 target              |
| ----------------------------- | ------------------- | ------------------------- |
| `vue`                         | `^2.7.16`           | `^3.5.x`                  |
| `vuetify`                     | `^2.7.2`            | `^3.7.x`                  |
| `vue-router`                  | `^3.6.5`            | `^4.6.x`                  |
| `vuex`                        | `^3.6.2`            | replace with `pinia ^2.3` |
| `@vitejs/plugin-vue2`         | `^1.1.2`            | `@vitejs/plugin-vue ^5.x` |
| `vite-plugin-vue2`            | `1.9.0`             | _removed_                 |
| `vite`                        | `^2.9.18`           | `^5.4.x`                  |
| `@vue/test-utils`             | `^1.3.6`            | `^2.4.x`                  |
| `vitest`                      | `^0.24.5`           | `^2.x`                    |
| `@vitest/ui`                  | `^0.24.5`           | `^2.x`                    |
| `jsdom`                       | `^20.0.3`           | `^25.x`                   |
| `vue-template-compiler`       | `^2.7.16`           | _removed_ (built into Vue 3) |
| `@vue/compiler-dom`           | `^3.5.34`           | follows `vue`             |
| `unplugin-vue-components`     | `^0.22.12`          | latest `^32.x` (Vue 3)    |
| `eslint-plugin-vuetify`       | `^1.1.0`            | `^2.7.x`                  |
| `vue-cli-plugin-vuetify`      | `^2.4.2`            | _removed_                 |
| `vuetify-loader`              | `^1.4.3`            | _removed_ (auto-imports via `vite-plugin-vuetify`) |
| `vue-highlight.js`            | `^4.0.0-beta`       | replace with `@highlightjs/vue-plugin ^2.x` (already used in djangobuilder4) |
| `vue-gtag`                    | `1.16.1`            | `vue-gtag` `^3.x` or `vue-gtag-next` |
| `@mdi/font`, `@mdi/js`        | `^6.1.95`           | `^7.x`                    |
| `raw-loader`                  | `^4.0.2`            | replace with Vite `?raw` imports |
| `babel-core`                  | `^6.26.3`           | _removed_                 |
| `selenium-server`             | `^3.141.59`         | _removed_ (or replace with Playwright) |
| `stylus`, `stylus-loader`     | current             | keep only if templates still use Stylus |

## Migration strategy

There are three viable strategies. We recommend **B**.

### A. Big-bang rewrite

Drop Vue 2 entirely in one PR. Lowest cost on paper, highest review and
regression risk; not recommended.

### B. Incremental migration on a long-lived branch (recommended)

1. Branch from `master` as `feat/io-vue3`.
2. Convert toolchain first (Vite 2 → 5, plugin swap, vue-tsc, eslint, vitest),
   keeping all `*.vue` files Vue-2 compatible via the
   [`@vue/compat`](https://v3-migration.vuejs.org/migration-build.html) build.
3. Replace Vuetify 2 with Vuetify 3 one route/page at a time, using the
   compat shims where possible.
4. Replace Vuex with Pinia (the v4 app is already on Pinia — share the store
   shape where it makes sense).
5. Drop `@vue/compat` once every component compiles cleanly under Vue 3.
6. Cut over.

This is the canonical Vue migration path documented at
<https://v3-migration.vuejs.org/>.

### C. Converge on `djangobuilder4`

If `djangobuilder4` is the long-term target anyway, treat this work as
porting the remaining `djangobuilder.io` features into `djangobuilder4` and
sunsetting `djangobuilder.io` rather than migrating it. This avoids holding
two apps under maintenance.

## Concrete work items (strategy B)

Estimated effort assumes a single engineer familiar with the codebase.

### Phase 0 — preparation (≈0.5 day)

- [ ] Cut `feat/io-vue3` from current `master`.
- [ ] Add a CI matrix entry so the `io_tests` and build jobs run on the
      migration branch in parallel with `master`.
- [ ] Snapshot the production deploy targets (`firebase use staging/production`)
      so the cutover doesn't surprise the deploy script in the `Makefile`.

### Phase 1 — Toolchain swap with `@vue/compat` (≈2–3 days)

- [ ] Bump `vue` to `^3.5.x` and add `@vue/compat` aliased as `vue` in
      `vite.config.js`, following the official migration build guide.
- [ ] Replace `vite-plugin-vue2` / `@vitejs/plugin-vue2` with
      `@vitejs/plugin-vue` (^5.x) and `@vitejs/plugin-vue-jsx` (^4.x).
- [ ] Bump `vite` to `^5.4.x` (matches `djangobuilder4`) and update the
      `vite.config.js` API surface (`process.env.npm_package_version`
      becomes a `define` for `import.meta.env.PACKAGE_VERSION` — already done).
- [ ] Bump `vitest` to `^2.x`, `@vitest/ui` to `^2.x`, `jsdom` to `^25.x`.
- [ ] Bump `@vue/test-utils` to `^2.4.x` and rewrite the test setup helpers
      (`tests/unit/**`) to use the new mounting API (`mount`/`shallowMount`
      now return a wrapper without `.vm` patches).
- [ ] Remove `vue-template-compiler` and `babel-core`.
- [ ] Drop `@typescript-eslint/eslint-plugin@5` and
      `@typescript-eslint/parser@5` (already unused in the flat
      `eslint.config.js`).
- [ ] Verify `yarn test_io` passes against the Vue-2 source running through
      `@vue/compat`.

### Phase 2 — Vuetify 2 → 3 (≈5–10 days, the bulk of the work)

Vuetify 3 is a near-complete rewrite. Plan to walk the component tree once.

- [ ] Replace `vuetify` `^2.7.2` with `^3.7.x`.
- [ ] Replace `vuetify-loader` and `vue-cli-plugin-vuetify` with
      `vite-plugin-vuetify` for auto-imports and theme tokens.
- [ ] Replace `eslint-plugin-vuetify` `^1.x` with `^2.7.x`.
- [ ] Update the entry point (`src/main.js` / `src/plugins/vuetify.js`) to
      Vuetify 3's `createVuetify({ components, directives, theme })`.
- [ ] Walk each `src/components/**/*.vue` and convert:
   - Grid: `v-row`/`v-col` API tweaks, removal of `v-flex`.
   - Buttons: `text` / `outlined` / `tonal` prop changes.
   - Icons: confirm `@mdi/js` import paths and switch to `@mdi/font` `^7.x`.
   - Dialogs: `persistent`, `width`, and slot names changed.
   - Forms: `v-text-field` / `v-select` props (rules, validation, density).
   - Lists, navigation drawer, app bar, snackbar — each has small breaking
     changes documented in the [Vuetify 3 migration guide](https://vuetifyjs.com/en/getting-started/upgrade-guide/).
- [ ] Update SCSS variables / theme overrides (file: `src/styles/...`) to
      Vuetify 3 theme tokens.
- [ ] Re-skin and visually QA each page (Login, ResetPassword, Splash,
      Project, ProjectsView, MainHeader, UnverifiedUser, UpgradeDialog,
      DeleteDialog, etc.).

### Phase 3 — Vuex → Pinia (≈2 days)

- [ ] Add `pinia` as a dependency and remove `vuex`.
- [ ] Convert each Vuex module under `src/store/**` to a Pinia store. Where
      the shape matches a `djangobuilder4` store, factor the shared logic
      out (a small `lib/djangobuilder-stores` workspace is one option).
- [ ] Replace `mapState` / `mapActions` calls in components with Pinia
      equivalents (`storeToRefs`, `useFooStore()`).

### Phase 4 — Router and ancillary deps (≈1 day)

- [ ] `vue-router` `^3` → `^4.6.x`: replace `new VueRouter()` with
      `createRouter({ history: createWebHistory(), routes })` and update any
      navigation guards that relied on the v3 callback-style API.
- [ ] Replace `vue-highlight.js` with `@highlightjs/vue-plugin` (already in
      use in `djangobuilder4`) for code-block rendering.
- [ ] Replace `raw-loader` imports with Vite's native `?raw` imports
      (`import readme from './README.md?raw'`).
- [ ] Replace or remove `vue-gtag` 1.x with `vue-gtag` 3.x (Vue 3 compatible)
      if analytics are still desired; otherwise drop.
- [ ] Decide what to do with `selenium-server` (currently unused at runtime;
      either delete or replace with Playwright if E2E coverage is wanted).

### Phase 5 — Remove the compat layer and ship (≈1 day)

- [ ] Remove `@vue/compat`, the alias in `vite.config.js`, and every
      `compat:` config flag from individual components.
- [ ] Re-run `yarn lint`, `yarn test_io`, `yarn build_io_production`, and
      `make smoke_test_ci`.
- [ ] Deploy to the `staging` Firebase project, run a manual smoke test on
      every route, then promote to `production`.
- [ ] Merge `feat/io-vue3` to `master`. Drop this document or move it into
      `docs/archive/`.

## Risks and watchpoints

1. **Vuetify 3 theme tokens differ from Vuetify 2 SCSS variables.** Any
   custom theme work in `src/styles/**` will need to be re-expressed.
2. **`unplugin-vue-components` resolver block-list.** The existing
   `vite.config.js` block-lists `VChart` and `VHeadCard` and resolves
   everything else from `vuetify/lib`. The Vuetify 3 import path is
   `vuetify/components`; the resolver entry must change accordingly.
3. **Firebase auth flow.** Both apps already use the modular Firebase 11
   SDK, so no compat work is needed there — but the migration should be
   regression-tested against the live Firebase Auth emulator.
4. **Composition API rewrites.** Vue 3 lets us keep the Options API, so
   components do not _have_ to be rewritten as `<script setup>` — but it is
   often easier to rewrite a heavily Vuetify-dependent component than to
   patch it. Budget some extra time for opportunistic rewrites.
5. **Tests are thin.** Today only two unit specs exist (`Login.spec.js`,
   `DeleteDialog.spec.js`). The migration is a good moment to add coverage
   for the routes most exercised in production, otherwise we will be
   relying entirely on manual smoke testing.
6. **`firebase-tools` versions.** Both apps share `firebase-tools` for
   deploys; the migration must not drift the Firebase CLI version, since
   `make deploy name=production` invokes it.

## Decision needed before kickoff

- Is path **B** (true migration) the right choice, or should we pursue path
  **C** (converge everything onto `djangobuilder4` and sunset
  `djangobuilder.io`)? The answer materially changes the work above —
  Phases 2 and 3 are the most expensive.
