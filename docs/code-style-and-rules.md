# Code Style And Rules

Follow the style already established in the package you are editing.

## Baseline

- Keep changes small and package-local when possible.
- Prefer explicit names and straightforward control flow over clever abstractions.
- Reuse existing patterns before introducing a new one.
- Avoid unrelated refactors in the same change.

## Verification

- Run the smallest relevant lint command first, then the broader repo command if the change crosses packages.
- Root lint: `yarn lint`
- Root lint fix: `yarn lint_fix`
- `djangobuilder4` also has type-checking in its build flow: `yarn workspace djangobuilder4 type-check`

## Notes by package

- `lib/djangobuilder-core`: TypeScript with Jest-based tests.
- `packages/djangobuilder.io`: Vue 2 app with ESLint and Vitest.
- `packages/djangobuilder4`: Vue 3 app with ESLint, Prettier-related config, and TypeScript type-checking.
