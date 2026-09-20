# How To Write Tests

Prefer targeted tests in the package you changed.

## Packages

- `lib/djangobuilder-core`: Jest tests and a smoke test for the core rendering and CLI code.
- `packages/djangobuilder.io`: Vitest unit tests for the Vue 3 app (legacy).
- `packages/djangobuilder5`: Vitest + Testing Library tests next to the source (`*.test.ts[x]`).
- `packages/djangobuilder4`: no test runner is wired into the root test flow yet, so avoid claiming test coverage here unless you add it explicitly.

## Commands

- Run all current tests: `bun run test`
- Run core tests: `bun run test_core`
- Run core smoke test: `bun run test_smoke`
- Run `djangobuilder.io` tests: `bun run test_io`
- Run `djangobuilder5` tests: `bun run test_v5`

## Expectations

- Add or update tests for any behavior change in `lib/djangobuilder-core`, `packages/djangobuilder.io` and `packages/djangobuilder5`.
- Keep tests close to the changed behavior and avoid broad snapshots when a focused assertion is clearer.
- Prefer behavior-level tests over tests that mirror implementation details.
- If a package does not yet have useful automated coverage, note that gap clearly in your change summary.
