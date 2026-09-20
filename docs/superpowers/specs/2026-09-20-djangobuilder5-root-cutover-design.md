# Spec: Serve `djangobuilder5` at `/` and move `djangobuilder.io` to `/legacy/`

Date: 2026-09-20

## Goal

Make the redesigned React app (`packages/djangobuilder5`) the app users get at the
site root, and keep the current Vue app (`packages/djangobuilder.io`) available at
`/legacy/`. `djangobuilder4` stays at `/db4/` unchanged.

This spec covers the repo changes, a local way to run the assembled site, and a
verified deploy to the **development** Firebase project. Staging and production
deploys, and the Firebase console change they need, are listed as manual cut-over
steps and are not run as part of this work.

## Decisions (agreed)

- **db4 stays at `/db4/`.** Narrowest change; removing it is a separate follow-up.
- **Old hash URLs are translated into db5 routes.** `/#/project/<id>` and friends
  land in the new UI (projects are shared), not in the legacy app.
- **Both apps link to each other.** db5's About page links to `/legacy/`; the legacy
  app shows a dismissible banner linking to `/`.
- **Scope:** code + config + docs, a local serve target, then a development deploy
  with live checks. Staging/production are the user's call afterwards.
- **Approach A: consolidated deploy.** Bases stay in each package's build scripts;
  one deploy script owns the site layout and the Makefile delegates to it.

## Current state

Firebase Hosting serves one assembled directory:

| Path     | Package             | Built with        |
|----------|---------------------|-------------------|
| `/`      | `djangobuilder.io`  | default base `/`  |
| `/db4/`  | `djangobuilder4`    | `--base=/db4/`    |
| `/db5/`  | `djangobuilder5`    | `--base=/db5/`    |

Two near-duplicate pipelines assemble it: the Makefile `deploy` target (writes
`dist_<env>/`, runs type-checks) and `script/deploy.sh` (writes `dist/<env>/`,
skips type-checks). `firebase.json` rewrites `db4/**` and `db5/**` to their own
`index.html` and everything else to the root `index.html`.

`djangobuilder5` already derives its router `basename` and its auth continue URL
from `import.meta.env.BASE_URL`, so nothing in its source hardcodes `/db5/`.
`djangobuilder.io` uses a hash router and has two places that hardcode the root:
the verification continue URL (`window.location.origin + '/#/login/'`) in
`SignUp.vue` and `UnVerified.vue`, and absolute icon paths in
`public/site.webmanifest`. A trial build with `--base=/legacy/` confirmed Vite
rewrites `index.html`'s favicon, manifest and asset URLs correctly.

Both apps use the same Firebase project and the same origin, so Firebase Auth
persistence is shared: a user signed in on one is signed in on the other. Project
document IDs are shared too. Production has never had `djangobuilder5` deployed.

## Target layout

| Path       | Package             | Vite base            |
|------------|---------------------|----------------------|
| `/`        | `djangobuilder5`    | `/` (Vite default)   |
| `/legacy/` | `djangobuilder.io`  | `/legacy/`           |
| `/db4/`    | `djangobuilder4`    | `/db4/` (unchanged)  |

## Section 1: builds, hosting config, deploy pipeline

### Build scripts

- `packages/djangobuilder5/package.json`: remove `--base=/db5/` from `build`,
  `build:development`, `build:staging`, `build-only`, `build-only:development`,
  `build-only:staging`.
- `packages/djangobuilder.io/package.json`: `build` becomes `vite build --base=/legacy/`.
  The root `build_io_*` scripts keep appending `--mode=<env>`.
- Root `package.json` scripts and both dev servers are unchanged. In dev,
  `import.meta.env.BASE_URL` stays `/` for both apps.

### `firebase.json`

```json
"rewrites": [
  { "source": "legacy/**", "destination": "/legacy/index.html" },
  { "source": "db4/**",    "destination": "/db4/index.html" },
  { "source": "**",        "destination": "/index.html" }
],
"redirects": [
  { "source": "/db5",    "destination": "/", "type": 301 },
  { "source": "/db5/**", "destination": "/", "type": 301 }
]
```

Redirects are evaluated before rewrites, so the catch-all cannot swallow `/db5/…`.
The unused copy `packages/djangobuilder.io/firebase.json` is deleted.

### One deploy pipeline

- `script/assemble_site.sh <out_dir>`: pure copy step. Requires a non-empty
  `<out_dir>` argument other than `/` or `.`, empties it, copies
  `packages/djangobuilder5/dist/` to its root, `packages/djangobuilder.io/dist/` to
  `<out_dir>/legacy/`, and `packages/djangobuilder4/dist/` to `<out_dir>/db4/`.
  Fails if any package `dist/` is missing.
- `script/deploy.sh <env>`: `bunx firebase use <env>` → `bun run build_<env>`
  (io + v4 + v5, with the type-checks the Makefile path already runs) →
  `script/assemble_site.sh dist_<env>` → `bunx firebase deploy --public=dist_<env>`.
  A full `firebase deploy` continues to push the shared Firestore rules and indexes,
  as today.
- Makefile `deploy` keeps its `name=` guard and runs `./script/deploy.sh $(name)`.
  The copy logic leaves the Makefile.

### Local serve (the "working locally" goal)

`firebase.json` already configures the hosting emulator on port 8082 with
`hosting.public = dist/`. A new Makefile target `serve_site` runs
`bun run build_development`, `script/assemble_site.sh dist`, then
`bunx firebase emulators:start --only hosting --project development` (the hosting
emulator needs a project alias but no deploy credentials). `http://localhost:8082/` then serves
the assembled site with the real rewrites and redirects, which the separate Vite
dev servers cannot show. `/dist` is already git-ignored.

### CI

In the `build` job, after `bun run build`: run `script/assemble_site.sh dist_ci`
and assert that `dist_ci/index.html`, `dist_ci/legacy/index.html` and
`dist_ci/db4/index.html` exist, that the legacy `index.html` references
`/legacy/assets/`, and that the root `index.html` references `/assets/` and not
`/db5/`. Upload `dist_ci` as a single `site_dist` artifact in place of the three
per-package uploads.

## Section 2: application changes

### `djangobuilder5`

1. **Comments.** Reword the `/db5/` subpath comments in `src/domain/firestore/auth.ts`
   and `src/lib/firebase.ts` so they describe the code, not the old layout. No
   behaviour change: `basename` resolves to `/` and the continue URL to
   `<origin>/login` automatically once the base is removed.
2. **Legacy hash shim.** New `src/lib/legacyHash.ts` exporting a pure function
   `legacyHashToPath(hash: string): string | null`:

   | Legacy hash                                        | Result                                           |
   |----------------------------------------------------|--------------------------------------------------|
   | `#/project/<id>`                                   | `/project/<id>`                                  |
   | `#/home`                                           | `/projects`                                      |
   | `#/login`, `#/login/`, `#/signup`, `#/about`, `#/unverified` | same name without the hash or trailing slash |
   | `#/reset_password`                                 | `/reset`                                         |
   | `#/action?mode=…&oobCode=…`                        | `/action` with the query string preserved        |
   | `#/verify/<code>`                                  | `/action?mode=verifyEmail&oobCode=<code>`        |
   | `#/reset/<code>`                                   | `/action?mode=resetPassword&oobCode=<code>`      |
   | `#/`, `#/error`, `#/debug`, any other `#/…`        | `/`                                              |
   | empty hash, or a hash not starting with `#/`       | `null` (do nothing)                              |

   `main.tsx` calls it once before rendering. It runs only when
   `location.pathname` equals the app base (`import.meta.env.BASE_URL`). When it
   returns a path, `history.replaceState(null, "", base + path)` swaps the URL in
   place so the router starts on the right route and history is not polluted.
   This also covers the Firebase console action URL: both the old `/#/action` form
   and the new `/action` form land on `ActionView`.
3. **Cross-link.** `AboutView` gains a short line, "Looking for the previous
   version?", with a plain `<a href="/legacy/">` (not a router `Link`, so the
   browser leaves the SPA).

### `djangobuilder.io` (legacy)

1. **Build base** `--base=/legacy/` (section 1).
2. **Continue URL helper.** `src/firebase_utils.js` exports
   `emailActionContinueUrl()` returning
   `window.location.origin + import.meta.env.BASE_URL + '#/login/'`. `SignUp.vue`
   and `UnVerified.vue` use it. Dev yields `/#/login/` (unchanged); the built app
   yields `/legacy/#/login/`.
3. **Manifest icons.** The two `src` values in `public/site.webmanifest` become
   relative (`android-chrome-192x192.png`, `android-chrome-512x512.png`) so they
   resolve next to the manifest under `/legacy/`.
4. **Banner.** New `src/components/LegacyBanner.vue`, mounted in `App.vue` above
   `<main-content />`: a slim, dismissible Vuetify banner reading "You're using the
   legacy Django Builder. Try the new version." with a plain `<a href="/">`.
   Dismissal is stored in `localStorage` under `legacy_banner_dismissed`. It renders
   whenever not dismissed, including in dev.
5. **Tab title.** `index.html` `<title>` becomes `Django Builder (Legacy)`.

### `djangobuilder4`

No changes.

## Section 3: docs, tests, verification, cut-over

### Docs

- `README.md`: the deploy section describes `make deploy name=<env>`, `make serve_site`,
  the three-path layout, and links to `docs/deployment.md`.
- New `docs/deployment.md`: layout table, how `assemble_site.sh`/`deploy.sh` build the
  site, the rewrites and redirects, the local serve target, and the manual cut-over
  steps below. `AGENTS.md` links to it.
- `docs/packages-and-code-layout.md`, `docs/how-to-write-a-feature.md`,
  `docs/how-to-write-tests.md`: add `djangobuilder5` (React) and its `dev5`,
  `build_v5`, `test_v5` commands; stop describing `djangobuilder.io` as Vue 2.

### Automated tests

- `djangobuilder5`: table-driven Vitest cases for `legacyHashToPath` covering every
  row above plus the `null` cases; an `AboutView` assertion for the `/legacy/` anchor.
- `djangobuilder.io`: a test for `emailActionContinueUrl` with `BASE_URL` of `/` and
  `/legacy/`; a `LegacyBanner` test for the `/` link target and that dismissing hides
  it and persists.
- CI: the assemble-and-check step from section 1.
- Gates before deploying: `bun run lint`, `bun run test`, `bun run build`,
  `bun run --filter=djangobuilder5 type-check`.

### Local verification

`make serve_site`, then on `http://localhost:8082`:

1. `/` shows the db5 splash; `/about` and `/project/<id>` resolve via the catch-all.
2. `/legacy/` loads the Vue app with favicon, manifest and images resolving;
   `/legacy` redirects to `/legacy/`.
3. `/db4/` loads; `/db5` and `/db5/anything` redirect to `/`.
4. `/#/project/<id>` becomes `/project/<id>`; `/legacy/#/project/<id>` opens the
   legacy project view.
5. The legacy banner links to `/`; the db5 About link points to `/legacy/`.

### Development deploy

`make deploy name=development`, then repeat the checks above on
`https://dev.djangobuilder.io`, plus: anonymous sign-in, create a project,
reload, project persists; sign up on `/legacy/` and confirm the verification email's
continue URL is `/legacy/#/login/`.

### Manual cut-over steps (outside the repo, not run here)

1. Firebase console → Authentication → Templates → customise action URL →
   `https://djangobuilder.io/action` for staging and production. The shim keeps the
   old value working in the meantime.
2. `make deploy name=staging`, repeat the checks, then `make deploy name=production`.

## Risks and mitigations

- **Firebase redirect glob syntax and the bare `/legacy` trailing-slash redirect** are
  confirmed on the local emulator and the dev deploy rather than assumed.
- **`/favicon.ico`** requests now hit the catch-all and get HTML. Harmless: db5
  declares an inline SVG icon. A `public/favicon.ico` for db5 is a possible follow-up.
- **Users with a legacy tab open at cut-over** get the new app on their next full
  load; auth is shared so they stay signed in, and their project bookmarks translate.
- **In-flight verification emails** sent by the legacy app point at `/#/login/`; the
  shim sends them to db5's `/login`. Emails sent after the change point at
  `/legacy/#/login/`.

## Out of scope

Removing `djangobuilder4`; a db5 `favicon.ico`; staging and production deploys;
any change to Firestore data or rules.
