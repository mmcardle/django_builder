# AGENTS.md — Django Builder

Guide for AI agents (and humans) working in this repo. Read this first, then
the deep-dive docs linked at the bottom.

> The `docs/` files are the source of truth for process. This file adds a
> project overview, a development quickstart, and hard-won gotchas. Where they
> disagree with reality, trust the code and note the drift.

## What this project is

**Django Builder** is a tool that generates a complete, runnable **Django
project** from a visual/JSON project definition. A user defines a project
(apps, models, fields, relationships, options like Channels/HTMX/Postgres) and
Django Builder renders and packages a full source tree as a downloadable
tarball: `models.py`, DRF `api.py`/`serializers.py`, `admin.py`, `forms.py`,
`views.py`, `urls.py`, templates, `settings.py`, `requirements.txt`,
pytest tests, ASGI/WSGI, optional Channels consumers, and HTMX views.

- Live app: https://djangobuilder.io
- Project data (for the web apps) lives in **Firebase / Firestore**; auth
  includes email/password **and anonymous login**.
- The same generation engine also runs headless via a **CLI**.

## Repository layout (Bun monorepo)

Workspaces are `lib/*` and `packages/*`.

| Path | Package | What it is |
|------|---------|------------|
| `lib/djangobuilder-core` | `@djangobuilder/core` | Framework-agnostic TypeScript generation engine. Handlebars templates, the `DjangoProject`/`App`/`Model`/`Field`/`Relationship` API, the renderer, a models importer, and the CLI. **This is where generation logic lives.** |
| `packages/djangobuilder.io` | `djangobuilder.io` | The primary/production web app. Vue 3 + Vuetify 3 + Pinia + vue-router (hash history). Recently migrated from Vue 2 — some docs still say "Vue 2", that is stale. |
| `packages/djangobuilder4` | `djangobuilder4` | A parallel, lighter Vue 3 app (Pinia, vue-router history mode, no Vuetify). Newer/alternate front end. No test runner is wired into the root `test` flow yet. |
| `bin/` | — | `django-builder` CLI wrapper. |
| `script/` | — | `cli_test.sh` — generates a project and runs it against real Django (used by CI). |
| `example_projects/` | — | Sample project definitions (`example-project.json`, `-postgres`, `with-channels.partial.json`). |
| `Makefile` | — | Smoke/integration targets that generate + install + run Django. |
| `.github/workflows/ci.yml` | — | CI: build, lint, core tests, io tests, and the Django integration matrix. |

Key detail: `@djangobuilder/core`'s `package.json` sets `"main": "src/index.ts"`,
so the apps import the core **TypeScript source directly** (Vite/Bun transpile
on the fly). You do **not** need to build core for dev/tests to see changes.
A `lib/djangobuilder-core/dist/` may exist but can be stale — don't rely on it.

## Environment & tooling

- **Bun** is the package manager and task runner (migrated from Yarn; see
  `package.json` `overrides` note and `docs/superpowers/specs/`). Version pinned
  in `mise.toml` and CI (`bun@1.3.14`).
- **Vite** is the bundler / dev server.
- **Python + uv** are used to actually install and run generated Django
  projects (integration testing). CI uses `astral-sh/setup-uv` + `setup-python`.

Install: `bun install` (CI uses `--frozen-lockfile`).

## Everyday commands (run from repo root)

```
bun run dev            # djangobuilder.io dev server (Vite; defaults to :8080)
bun run dev4           # djangobuilder4 dev server (defaults to :8081)
bun run build          # build both apps (build_io + build_v4)
bun run lint           # lint core + io + v4   (bun run lint_fix to autofix)
bun run test           # test_smoke + test_core + test_v4(noop) + test_io
bun run test_smoke     # core: tsc typecheck + run smoketest.ts (renders a project)
bun run test_core      # core: jest snapshot tests
bun run test_io        # djangobuilder.io: vitest unit tests
bun run cli <in.json> <out.tar>   # render a project tarball via the core CLI
bun run --filter=djangobuilder4 type-check   # v4 TS type-check (part of its build)
```

Generate + run a real Django project locally (what CI's `cli_test.sh` does):

```
bun run cli example_projects/example-project.json /tmp/out.tar
mkdir -p /tmp/proj && tar -xf /tmp/out.tar -C /tmp/proj
cd /tmp/proj/DjangoProject
uv venv --python 3.13
uv pip install -r requirements.txt -r requirements-dev.txt
uv run python manage.py makemigrations && uv run python manage.py migrate
uv run python manage.py check      # the CI gate
uv run pytest
```

`Makefile` targets (`create`, `run_django`, `test_django`,
`smoke_test`/`smoke_test_ci`) wrap these flows.

## How generation works (the core)

- The `DjangoProject` object graph (`lib/djangobuilder-core/src/api.ts`) is
  rendered through Handlebars templates under
  `lib/djangobuilder-core/src/django/**` by `src/rendering.ts`.
- A project's Django version is a `DjangoVersion` enum
  (`lib/djangobuilder-core/src/types.ts`) and is emitted into templates as
  `{{project.version}}` (e.g. `requirements.txt` → `Django=={{project.version}}`,
  and the `docs.djangoproject.com/en/{{project.version}}/` links in
  `settings.py`/`urls.py`).
- The web apps build a core `DjangoProject` from stored Firestore data via a
  `toCoreProject`-style mapping; the CLI reads a JSON project file.

## Testing & CI

- **Core**: Jest snapshot tests (`lib/djangobuilder-core/tests/renderer.test.ts`,
  ~170 snapshots) + a smoke test (`src/smoketest.ts`) that renders a rich
  project. Update tests for any behavior change in core.
- **djangobuilder.io**: Vitest unit tests (`packages/djangobuilder.io/tests`).
- **djangobuilder4**: no automated tests wired into `bun run test` yet — don't
  claim coverage there unless you add it.
- **CI** (`.github/workflows/ci.yml`): `build`, `lint`, core smoke + unit, io
  unit, and **`cli_tests`** — a `python × django_version` matrix that installs
  the generated project's deps and runs `makemigrations`/`migrate`/`check`/
  `pytest` plus a live HTTP + WebSocket smoke test (Postgres + Channels + HTMX).

## Common tasks

### Adding a new Django version (checklist)

Adding a Django version is a well-worn, multi-file pattern. Mirror the
"Django 5" PR (#221) and the Django 6 work. Touch **all** of:

1. `lib/djangobuilder-core/src/types.ts` — add `DJANGOn` to the `DjangoVersion`
   enum.
2. `lib/djangobuilder-core/src/index.ts` — bump `DEFAULT_DJANGO_VERSION` if the
   new version should be the default.
3. `packages/djangobuilder.io/src/schemas.js` — add the `{text, value}` option.
4. `packages/djangobuilder.io/src/store.js` — extend the
   `String(django_version).startsWith(...)` → enum mapping.
5. `packages/djangobuilder4/src/views/ProjectsView.vue` — add to
   `DjangoVersionChoices`, and update the default `django_version` ref + reset.
6. `packages/djangobuilder4/src/components/ProjectHeader.vue` — add to its
   `DjangoVersionChoices`.
7. `packages/djangobuilder4/src/stores/user.ts` — extend the version→enum
   mapping.
8. `.github/workflows/ci.yml` — add the version to the `cli_tests` matrix and
   add Python `exclude`s for Python versions that Django series doesn't support
   (e.g. Django 6.0 requires Python ≥ 3.12, so exclude 3.11).

Keep old versions in the enum **and** in the store mappings even if you remove
them from the pickers — existing Firestore projects still need to map/render.

## Gotchas & learnings

- **`DjangoVersion` is a numeric enum** (`3.2, 4.1, 5.1, 6.0`). Numbers like
  `6.0` stringify to `"6"` in JS, so projects generated **through the web apps**
  pin `Django==6` and use `/en/6/` doc URLs. That still installs Django 6.0 (pip
  version padding), but it's cosmetically off. The **CLI/CI path is clean**:
  `script/cli_test.sh` injects `DJANGO_VERSION` as a raw **string** via `jq`
  (`{"version": "6.0"}`), bypassing the enum, so those pin `Django==6.0`. A real
  fix is to make the enum use string values — a larger change (Firestore data
  round-trips through it), so weigh carefully.
- **JS object key ordering bites the v4 version pickers.** `DjangoVersionChoices`
  is a plain object; whole-number keys (`"6"`) are hoisted ahead of decimal keys
  (`"5.1"`, `"4.1"`, `"3.2"`). List entries **descending** so the UI renders
  6 / 5 / 4 / 3. (`djangobuilder.io` uses an ordered array, so it's unaffected.)
- **Docs can lag reality.** `djangobuilder.io` is Vue 3 now (docs still say
  Vue 2). Verify framework/versions in each package's `package.json`.
- **The apps consume core from `src`**, not `dist`. No core build needed to test
  app changes; ignore/regenerate stale `dist/`.
- **`test_v4` is a no-op** (`echo 'not implemented'`) in the root `test` script.

## Verifying changes (do this, don't just trust the diff)

- **Generation changes**: render a real project via the CLI and run it against
  real Django with `uv` (`makemigrations`/`migrate`/`check`/`pytest`). Python +
  uv are available in this environment.
- **UI changes**: both apps have **"Sign In Anonymously"**, so you can drive the
  full create-project flow with the Playwright MCP without credentials.
  - The Playwright MCP is pinned to the **`chrome` channel** and needs Chrome
    installed once: `npx playwright install chrome` (needs `sudo` for system
    deps, so a human runs it).
  - Do **not** click "Create"/"Submit" on a project form unless you intend to
    write to the live Firebase backend — verifying the picker/form state is
    usually enough. (Anonymous auth itself only creates a throwaway session.)
- Dev server ports: `djangobuilder.io` → `:8080`, `djangobuilder4` → `:8081`
  (Vite auto-increments if the port is taken — check the startup log).

## Conventions

- Keep changes **small and package-local**; find the owning package first.
- Reuse existing patterns; avoid unrelated refactors in the same change.
- Run the smallest relevant lint/test first, then the repo-wide command if the
  change crosses packages.
- Commit/push only when asked; branch off `master` for new work.

## Deep-dive docs

- [How To Write A Feature](docs/how-to-write-a-feature.md)
- [How To Write Tests](docs/how-to-write-tests.md)
- [Packages And Code Layout](docs/packages-and-code-layout.md)
- [Code Style And Rules](docs/code-style-and-rules.md)
- [Vue 2 → Vue 3 Migration Plan](docs/VUE2_TO_VUE3_MIGRATION_PLAN.md)
