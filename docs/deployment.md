# Deployment

Django Builder is one Firebase Hosting site assembled from three package builds and
deployed to three Firebase projects.

## Environments

These are the only valid URLs for each environment. Test, share and document against them.

| Environment   | `firebase use` alias | Firebase project                 | URL                            |
|---------------|----------------------|----------------------------------|--------------------------------|
| Development   | `development`        | `django-builder-dev`             | https://dev.djangobuilder.io/     |
| Staging       | `staging`            | `django-builder-staging-4e7f2`   | https://staging.djangobuilder.io/ |
| Production    | `production`         | `django-builder-productio-6c3ca` | https://djangobuilder.io/         |

## Layout

| Path       | Package                       | Vite base   |
|------------|-------------------------------|-------------|
| `/`        | `packages/djangobuilder5`     | `/`         |
| `/legacy/` | `packages/djangobuilder.io`   | `/legacy/`  |
| `/db4/`    | `packages/djangobuilder4`     | `/db4/`     |

Each package sets its own base in its `build` scripts. `script/assemble_site.sh <out_dir>`
is the only place that knows the layout: it copies the three `dist/` folders into one tree.

`firebase.json` rewrites `/legacy/**` and `/db4/**` to their own `index.html` and everything
else to the root `index.html` (djangobuilder5 uses history routing). `/db5` and `/db5/**`
redirect to `/` for anyone with an old development bookmark.

## Run the assembled site locally

```
make serve_site
```

Builds all three apps in development mode, assembles them into `dist/`, and serves them on
the Firebase hosting emulator at http://localhost:8082 with the real rewrites and redirects.
Use this to check anything that involves the layout; the per-package Vite dev servers
(`bun run dev`, `dev4`, `dev5`) each serve a single app at `/`.

Use `make serve_site` to check routing and assets. Check sign-in and other Firebase Auth
flows on the environment URL above, or on the per-package Vite dev servers.

## Deploy

```
make deploy name=development   # or staging / production
```

Runs `script/deploy.sh`: `firebase use <name>`, `bun run build_<name>`, assemble into
`dist_<name>/`, `firebase deploy --public=dist_<name>`. The deploy also pushes the shared
Firestore rules and indexes from `firebase.json`.

CI runs the assemble script on every pull request and asserts the three `index.html`
files exist with the right asset bases.

## Old URLs

djangobuilder5 translates legacy hash URLs at startup (`src/lib/legacyHash.ts`):
`/#/project/<id>` → `/project/<id>`, `/#/login/` → `/login`, `/#/action?…` → `/action?…`,
and so on. Old bookmarks and already-sent verification emails keep working.

## Audit an environment's data for legacy formats

Projects created before the December 2024 core refactor store field and relationship
types as full Django paths (`django.db.models.DateTimeField`) and targets as full class
paths (`django.contrib.auth.models.User`). Readers normalise these. Five field types that
Django has since dropped (`AutoField`, `BigAutoField`, `CommaSeparatedIntegerField`,
`IPAddressField`, `NullBooleanField`) cannot be normalised: djangobuilder5 skips such a
field in generated code with a console warning and shows it as `<type> (unsupported)`.

To see what an environment actually holds, run the read-only audit as the project owner:

```
bunx firebase login          # once
bun run audit_legacy_data production   # or development / staging
```

By default it uses Firestore count aggregations and targeted queries, so it costs a few
dozen document reads however large the data is. It reports how many fields and
relationships still use the dotted names, how many fields use a retired type, how many
projects are below Django 3, and lists every affected project (id, owner uid, reason). The
report is also written to `legacy-data-audit.<env>.json` at the repo root (`--out <file>`
to choose). Nothing is written to Firestore.

`--full` additionally reads every document to check for dangling references, orphans and
fields with no type. That costs one read per document. On the Spark plan the daily read
quota (50,000) is shared with the live site, so a full scan of production can block users
until the quota resets at midnight Pacific. Run it only when the totals printed by the
default mode make that cost acceptable, or after moving the project to the Blaze plan.

Application-default credentials (`GOOGLE_APPLICATION_CREDENTIALS` or gcloud) are used
instead of the Firebase CLI login when present.

## Cut-over checklist (manual, per Firebase project)

1. Firebase console → Authentication → Templates → customise action URL →
   `https://djangobuilder.io/action`. The old `/#/action` value keeps working through the
   shim, so this can be done before or after the deploy.
2. `make deploy name=staging`, then on https://staging.djangobuilder.io/ check `/`, `/legacy/`,
   `/db4/`, a `/#/project/<id>` link and a sign-up verification email.
3. `make deploy name=production` and repeat the checks on https://djangobuilder.io/.
