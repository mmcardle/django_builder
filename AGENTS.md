# AGENTS

Guidance for AI coding agents working in this repository.

## What this project is

Django Builder is a Vue 2 + Vuetify single-page app backed by Firebase
(Firestore + Auth + Hosting). It lets users visually design Django projects
and renders them as downloadable tarballs of Python/Django source files.

Live: https://djangobuilder.io

## Quick start

```
yarn install
cp .env.example .env.development.local   # fill in Firebase config
yarn serve                                # dev server on :8082
yarn test:unit                            # Jest unit tests
yarn lint                                 # ESLint
```

See `README.md` for Firebase setup and deployment details.

## Task-specific guides

Before making non-trivial changes, read the relevant guide(s) in `docs/`:

- [Packages and code layout](docs/packages-and-code-layout.md) — where things
  live and how the modules fit together.
- [Code style and rules](docs/code-style-and-rules.md) — ESLint config, Vue
  conventions, formatting expectations.
- [How to write a feature](docs/writing-a-feature.md) — adding components,
  routes, store state, and Django rendering output.
- [How to write tests](docs/writing-tests.md) — unit tests (Jest) and e2e
  tests (Nightwatch).

## Ground rules for agents

- Keep diffs focused: don't reformat unrelated files.
- Match existing style (2-space indent, no semicolons in most `.js`/`.vue`,
  single quotes). Don't introduce TypeScript, Vue 3 syntax, or a new
  framework.
- Run `yarn lint` and `yarn test:unit` before finishing a change that
  touches `src/` or `tests/`.
- Don't commit secrets — `.env.*.local` files are gitignored for a reason.
- Don't bump major dependency versions without being asked.
