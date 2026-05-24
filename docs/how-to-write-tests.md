# How To Write Tests

Prefer targeted tests in the package you changed.

## Packages

- `lib/djangobuilder-core`: Jest tests and a smoke test for the core rendering and CLI code.
- `packages/djangobuilder.io`: Vitest unit tests for the Vue 2 app.
- `packages/djangobuilder4`: no test runner is wired into the root test flow yet, so avoid claiming test coverage here unless you add it explicitly.

## Commands

- Run all current tests: `yarn test`
- Run core tests: `yarn test_core`
- Run core smoke test: `yarn test_smoke`
- Run `djangobuilder.io` tests: `yarn test_io`

## Expectations

- Add or update tests for any behavior change in `lib/djangobuilder-core` and `packages/djangobuilder.io`.
- Keep tests close to the changed behavior and avoid broad snapshots when a focused assertion is clearer.
- Prefer behavior-level tests over tests that mirror implementation details.
- If a package does not yet have useful automated coverage, note that gap clearly in your change summary.
