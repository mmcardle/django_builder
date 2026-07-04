# Spec: Migrate `django_builder` from Yarn → Bun (Vite retained)

Date: 2026-07-04

## Goal

Replace Yarn as the package manager **and** task runner with **Bun** across the
whole monorepo. **Vite is retained** as the bundler / dev-server for both apps —
it is simply executed through Bun, not replaced by Bun's native bundler.

## Decisions (agreed)

- **Bun-only runtime.** `node` is removed from `mise`; Bun is the JS runtime.
- **CLI ported to bun-native.** `bin/django-builder` runs under `bun`, dropping
  the `esm` CommonJS loader.
- **Full removal.** Every `yarn`/`npm`/`npx` reference (scripts, CI, Makefile,
  shell scripts, READMEs, docs) is converted to Bun. `yarn.lock` +
  `yarn-error.log` deleted; `bun.lock` committed.
- **Firebase CLI** invoked as `bunx firebase …` in deploy glue (no node on PATH).

## Changes

### Package manager / root `package.json`
- Delete `yarn.lock`, `yarn-error.log`; generate text `bun.lock`.
- Keep `workspaces` (Bun-native) and `resolutions` (Bun-supported). **Validate**
  the `**/parent/child` selective entries are honored; convert any unhonored pin
  to Bun `overrides` (nested form) to preserve it.
- Add `"packageManager": "bun@1.3.14"`.
- Add `"trustedDependencies"` for postinstalls Bun blocks but we need (populated
  from `bun install`'s blocked-scripts report — e.g. `esbuild`).
- Root scripts: `yarn workspace <name> <script>` → `bun run --filter=<name> <script>`
  (fallback `cd packages/<name> && bun run <script>` if `--filter` arg-forwarding
  misbehaves); `yarn run X` → `bun run X`.

### Workspace `package.json`s
- `@djangobuilder/core`: `npx tsc && npx ts-node src/smoketest.ts` →
  `bunx tsc && bun src/smoketest.ts`; `cli` → `bun src/cli.ts render`; drop
  now-unused `ts-node`.
- `djangobuilder.io`: `yarn run lint --fix` → `bun run lint --fix`;
  `yarn bic` → `bic`; remove unused `esm` dependency.
- `djangobuilder4`: unchanged (uses `run-p`/`run-s` bins, no yarn/npm refs).

### CLI bin (bun-native; also fixes latent bug)
- Refactor `lib/djangobuilder-core/src/cli.ts`: wrap top-level `switch` in
  `export function main(argv: string[])`, guard with
  `if (import.meta.main) main(process.argv.slice(2))`. `render` behavior
  unchanged.
- `bin/django-builder`: `#!/usr/bin/env bun`, import `main`, call
  `main(["render", ...process.argv.slice(2)])` so
  `django-builder input.json output.tar` works as the README documents.

### CI (`.github/workflows/ci.yml`)
- Replace `actions/setup-node` + yarn-cache steps with `oven-sh/setup-bun@v2`
  (pin 1.3.14). `yarn install`/`yarn` → `bun install --frozen-lockfile`;
  `yarn X` → `bun run X`.

### Shell / build glue
- `Makefile`: `yarn run …` → `bun run …`.
- `script/deploy.sh`: `yarn --cwd …` → `bun run --filter=…` (or cd-subshell);
  `firebase …` → `bunx firebase …`.
- `script/cli_test.sh`: `yarn run cli` → `bun run cli`.
- `mise.toml`: `node = "22"` → `bun = "1.3.14"`.

### Docs
- Convert yarn/npm → bun in `README.md`, `packages/djangobuilder4/README.md`,
  `docs/*.md` (incl. "Yarn workspace" → "Bun workspace"); `npm install -g
  firebase-tools` → note it is a workspace dep run via `bunx firebase`.

## Validation (evidence required before "done")
1. `bun install` clean; blocked postinstalls resolved into `trustedDependencies`;
   `bun.lock` present; `@djangobuilder/core` linked into both apps.
2. `resolutions` pins confirmed applied (else converted to `overrides`).
3. `bun run build`, `bun run lint`, `bun run test_smoke`, `bun run test_core`,
   `bun run test_io` all pass.
4. `bun run cli` and `./bin/django-builder` each produce a valid tar.

## Risks
- **`resolutions` selective (`**/x/y`) support** — primary risk; mitigation
  `overrides`.
- **firebase-tools under bun** — deploy path only (not exercised by CI);
  validated to launch, full deploy remains manual.

## Implementation outcomes (what actually happened)

Recorded after execution; a few things deviated from the plan above.

1. **Selective version pins dropped (not converted).** Bun 1.3.14 supports
   neither nested `resolutions` nor nested `overrides` — only flat, top-level
   pins. The 32 selective `**/parent/child` pins were therefore dropped. Before
   dropping, verified Bun's fresh resolution already meets/exceeds every floor
   (`minimatch` 3.1.5/5.1.9/6.2.3/9.0.9/10.2.5; `ajv` 6.15.0/8.20.0;
   `path-to-regexp` express→0.1.13, router→8.4.2). The 10 flat pins are kept in
   `overrides`; `bun.lock` freezes the resolved tree. A `comment:overrides` key
   in `package.json` records this.
2. **`bunfig.toml` with `linker = "hoisted"` added.** Bun's default symlinked
   store (`node_modules/.bun/...`) broke the djangobuilder4 Vite build — Rollup
   could not resolve `firebase`'s deep `@firebase/app` import. A flat/hoisted
   `node_modules` (like Yarn) fixes it. (io was unaffected because it imports the
   self-contained `firebase/compat/app`.)
3. **CLI split instead of `import.meta.main`.** `@djangobuilder/core` is a
   CommonJS package (no `"type": "module"`), so `tsc` rejects `import.meta` in
   `cli.ts` (TS1470) during `test_smoke`. Solution: `cli.ts` stays a pure module
   exporting `main`; a new 3-line `src/cli-run.ts` is the direct-run entry
   (`bun src/cli-run.ts render`). `bin/django-builder` imports `main` directly.
   This also fixed the previously-broken bin (`django-builder in.json out.tar`
   now works and produces a tar byte-identical in structure to `bun run cli`).
4. **No `trustedDependencies` needed.** `bun install` reported 0 blocked
   postinstall scripts.
5. **`PACKAGE_VERSION` still injected.** `bun run` sets `npm_package_version`,
   so `vite.config.js`'s version define works unchanged (verified `2.0.0` in the
   built io bundle).

### Validation results
- `bun run build` (io + v4): pass
- `bun run lint`: pass
- `bun run test_smoke`: pass
- `bun run test_core`: 174 passed
- `bun run test_io`: 5 passed (these 4 previously *failed* on the stale Yarn
  tree due to a hoisted Vue 2; Bun's fresh install resolves Vue 3 for io)
- `bun run cli` + `./bin/django-builder` + `make create`: pass, identical output
- Confirmed Bun runs node-shebang `.bin` tools (eslint, vitest) with **no node
  on PATH**, so bun-only CI is viable.
