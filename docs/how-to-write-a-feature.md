# How To Write A Feature

Start by identifying which workspace owns the change:

- `lib/djangobuilder-core`: shared generation logic, CLI behavior, templates, and code used by both apps.
- `packages/djangobuilder.io`: the Vue 2 app.
- `packages/djangobuilder4`: the Vue 3 app.

## Typical flow

1. Find the owning package before changing code.
2. Keep changes local to that package unless the feature is genuinely shared.
3. Update shared core code first if both apps depend on the same behavior.
4. Run the smallest relevant lint and test commands before expanding scope.

## Useful commands

- Root lint: `bun run lint`
- Root tests: `bun run test`
- Vue 2 app dev server: `bun run dev`
- Vue 3 app dev server: `bun run dev4`
- Production-style builds: `bun run build`, `bun run build_development`, `bun run build_staging`, `bun run build_production`

## Rules of thumb

- Prefer small, package-scoped changes over cross-workspace edits.
- Reuse existing patterns in the package you are touching.
- If you add new behavior in shared code, verify both app surfaces that depend on it.
