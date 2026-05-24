# Code style and rules

## Linting

ESLint config lives in `package.json` under `eslintConfig`. It extends
`plugin:vue/essential` and `eslint:recommended`, plus the `vuetify`
plugin.

Run before committing:

```
yarn lint
```

Enforced rules worth knowing:

- `vuetify/no-deprecated-classes`: error
- `vuetify/no-legacy-grid`: error
- `no-empty-pattern`: error
- `no-unused-vars`: error, but variables/args prefixed with `_` or
  named `unused` are allowed. Use `_unused` for intentionally unused
  destructured values or callback args.
- `no-console`: off — `console.log` is allowed but use sparingly.

Parser is `babel-eslint` (see `babel.config.js`).

## JavaScript / Vue style

Match the existing codebase:

- 2-space indentation, LF line endings.
- Single quotes for strings; backticks for interpolation.
- No semicolons in most `.js` and `<script>` blocks — follow the file
  you're editing rather than mixing styles.
- Prefer `const`; use `let` only when reassigning.
- Arrow functions for callbacks; method shorthand inside Vue options.
- Keep Vue 2 Options API (`data`, `computed`, `methods`, `watch`,
  lifecycle hooks). Do not introduce the Composition API or `<script
  setup>` — this project is on Vue 2.5 + Vuetify 2.
- Import from `@/...` (the `src` alias) rather than long relative
  paths.

## Vuex

- All Firestore-backed state goes through the single store in
  `src/store.js`.
- Read via getters (`store.getters.models()`), write via mutations and
  actions. Don't mutate state objects directly from components.

## Firebase

- Use the `firebase/compat/*` modular-compat imports already used in
  `src/store.js` and `src/plugins/firebase.js`. Don't mix in the v9
  modular API in the same file.

## Python / Django output (`src/django/`)

- Files in `src/django/python/`, `templates/`, `requirements/`, and
  `tests/` are loaded as raw strings and emitted into generated
  projects. Keep them valid Python / Django templates — they aren't
  executed in this repo but are by users' downloads.
- Mind whitespace and trailing newlines: changes show up byte-for-byte
  in the generated tarball.

## Files and naming

- Vue components: `PascalCase.vue` in `src/components/`.
- JS modules: `lower_snake_case.js` or `camelCase.js` — match the
  neighbouring files.
- Tests: `Foo.spec.js`, mirroring the path of the file under test.

## Things not to do

- Don't add TypeScript.
- Don't upgrade Vue, Vuetify, or Firebase major versions casually.
- Don't introduce a new state-management or styling library.
- Don't commit `.env.*.local`, service-account JSON, or `dist*/`.
