# Deployment

Django Builder is one Firebase Hosting site assembled from three package builds.

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

## Cut-over checklist (manual, per Firebase project)

1. Firebase console → Authentication → Templates → customise action URL →
   `https://djangobuilder.io/action`. The old `/#/action` value keeps working through the
   shim, so this can be done before or after the deploy.
2. `make deploy name=staging`, check `/`, `/legacy/`, `/db4/`, a `/#/project/<id>` link and
   a sign-up verification email, then `make deploy name=production`.
