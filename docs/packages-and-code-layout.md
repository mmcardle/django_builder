# Packages and code layout

## Top level

```
src/            Vue app source
tests/          Jest unit tests and Nightwatch e2e tests
public/         Static assets served as-is
firebase.json   Firebase hosting + emulator config
firestore.*     Firestore rules and indexes
vue.config.js   Vue CLI build config (dev port 8082)
jest.config.js  Unit test config (testMatch tests/unit/**/*.spec.js)
nightwatch.conf.js  e2e config
```

## `src/`

- `main.js` — app bootstrap (Vue, Vuetify, router, store, analytics).
- `App.vue` — root component, very thin.
- `router.js` — `vue-router` route table; lazy-loads page components.
- `store.js` — single Vuex store. Holds Firestore snapshots for
  `projects`, `apps`, `models`, `fields`, `relationships`, plus the
  current `user`.
- `schemas.js` — default shapes used when creating new entities.
- `constants.js`, `utils.js`, `dialogs.js` — small shared helpers.
- `firebase_utils.js` and `plugins/firebase.js` — Firebase init and
  Firestore helpers. Auth uses the `firebase/compat` SDK.
- `plugins/vuetify.js` — Vuetify instance / theme.

### `src/components/`

Page-level and dialog Vue SFCs. Forms live in `components/forms/`,
shared bits in `components/inc/`. Components are imperative and read
state via Vuex getters / mutations rather than props drilling.

### `src/mixins/`

Vue mixins reused across components (e.g. `AddProject.js`).

### `src/django/`

The code-generation engine. This is what turns a project definition in
the store into a Django source tree.

- `index.js` — entry point; orchestrates rendering.
- `rendering.js` — the big one: produces every Python/HTML/requirements
  file as strings.
- `importer.js` — parses uploaded Django source back into store models.
- `python/` — static Python files copied into every generated project
  (`settings.py`, `asgi.py`, `wsgi.py`, `urls.py`, etc.).
- `templates/` — `*.html.tmpl` Django templates copied verbatim.
- `requirements/` — `requirements.txt` snippets.
- `tests/` — `pytest.ini`, test settings, test requirements for the
  generated project (not for this repo's own tests).

These non-JS files (`.py`, `.txt`, `.ini`, `.html.tmpl`) are loaded as
raw strings via `raw-loader` (webpack) and `jest-raw-loader` (Jest),
configured in `vue.config.js` and `jest.config.js`.

### `src/tar/`

Wraps `tar-js` to assemble the generated files into a downloadable
tarball in the browser.

## `tests/`

- `tests/unit/` — Jest + `@vue/test-utils`, mirrors `src/` layout.
  - `setup.js` registers `vue-router` and `vuetify` globally.
  - `tests/unit/django/` covers the renderer.
- `tests/e2e/` — Nightwatch scenarios. Run against the Firebase
  emulator (`yarn test:e2e_serve`).

## Path alias

`@/foo` resolves to `src/foo` in both webpack and Jest
(`moduleNameMapper` in `jest.config.js`).
