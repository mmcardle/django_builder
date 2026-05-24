# Packages And Code Layout

This repo is a Yarn workspace split between shared library code and app packages.

## Top level

- `lib/djangobuilder-core`: shared TypeScript core used by the apps and CLI.
- `packages/djangobuilder.io`: the Vue 2 application.
- `packages/djangobuilder4`: the Vue 3 application.
- `bin/`: top-level scripts.
- `script/`: project helper scripts.
- `example_projects/`: example project inputs.

## Package ownership

- Put framework-agnostic generation logic in `lib/djangobuilder-core`.
- Put UI behavior in the app package that renders it.
- Keep package boundaries explicit; do not move app-specific behavior into core just because multiple files use it.

## Working style

- Read the local package layout before adding files.
- Match existing naming and folder conventions inside the package you change.
- Prefer extending an existing module over creating a parallel structure with overlapping responsibility.
