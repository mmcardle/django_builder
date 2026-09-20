# djangobuilder5 Root Cut-over Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve `djangobuilder5` at `/`, the Vue `djangobuilder.io` app at `/legacy/`, keep `djangobuilder4` at `/db4/`, with one deploy pipeline, a local serve target, and a verified development deploy.

**Architecture:** Each package keeps its Vite base in its own build scripts (`/` for db5, `/legacy/` for .io, `/db4/` for db4). A new `script/assemble_site.sh` is the single place that knows the site layout; `script/deploy.sh` and a `make serve_site` target both call it, and CI runs it to assert the layout. db5 gains a startup shim that translates legacy `#/…` URLs into its own routes; the legacy app gets a base-aware continue URL, relative manifest icons, and a banner pointing at the new app.

**Tech Stack:** Bun workspaces, Vite 6, React 19 + react-router 7 (db5), Vue 3 + Vuetify 3 (.io), Vitest, Firebase Hosting + `firebase-tools` 15 (emulator on port 8082), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-20-djangobuilder5-root-cutover-design.md`

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `script/assemble_site.sh` | create | Copy the three package `dist/` dirs into one hosting tree |
| `script/deploy.sh` | rewrite | `firebase use` → build → assemble → deploy |
| `Makefile` | modify | `deploy` delegates to the script; new `serve_site` target |
| `firebase.json` | modify | rewrites for `legacy/**`, `db4/**`, `**`; redirects `/db5*` → `/` |
| `packages/djangobuilder.io/firebase.json` | delete | Stale unused copy |
| `packages/djangobuilder5/package.json` | modify | Drop `--base=/db5/` |
| `packages/djangobuilder.io/package.json` | modify | `build` gets `--base=/legacy/` |
| `packages/djangobuilder5/src/lib/legacyHash.ts` (+ test) | create | Pure hash→path mapping and the in-place redirect |
| `packages/djangobuilder5/src/main.tsx` | modify | Call the redirect before rendering |
| `packages/djangobuilder5/src/domain/firestore/auth.ts`, `src/lib/firebase.ts` | modify | Reword `/db5/` comments |
| `packages/djangobuilder5/src/features/about/AboutView.tsx` (+ test) | modify | Link to `/legacy/` |
| `packages/djangobuilder.io/src/firebase_utils.js` (+ test) | modify | `emailActionContinueUrl()` |
| `packages/djangobuilder.io/src/components/SignUp.vue`, `UnVerified.vue` | modify | Use the helper |
| `packages/djangobuilder.io/src/components/LegacyBanner.vue` (+ test) | create | Dismissible "try the new version" banner |
| `packages/djangobuilder.io/src/components/MainContent.vue` | modify | Mount the banner in place of the old EOL alert |
| `packages/djangobuilder.io/public/site.webmanifest`, `index.html` | modify | Relative icons; "(Legacy)" title |
| `.github/workflows/ci.yml` | modify | Assemble + layout assertions; single `site_dist` artifact |
| `README.md`, `AGENTS.md`, `docs/deployment.md` (new), `docs/packages-and-code-layout.md`, `docs/how-to-write-a-feature.md`, `docs/how-to-write-tests.md` | modify/create | Document the layout, commands and cut-over |

Tasks 1–2 deliver the "working locally" goal first. Tasks 3–6 are app changes. Tasks 7–8 are CI and docs. Task 9 is gates + dev deploy.

---

### Task 1: Assemble script, deploy script, Makefile targets

**Files:**
- Create: `script/assemble_site.sh`
- Rewrite: `script/deploy.sh`
- Modify: `Makefile` (the `deploy` target and the `PHONY` line)

- [x] **Step 1: Create the assemble script**

```bash
#!/bin/bash
# Assemble the Firebase Hosting site from the three package builds:
#   /        <- packages/djangobuilder5/dist
#   /legacy/ <- packages/djangobuilder.io/dist
#   /db4/    <- packages/djangobuilder4/dist
# Usage: script/assemble_site.sh <out_dir>
set -euo pipefail

OUT=${1:-}
if [ -z "$OUT" ] || [ "$OUT" = "/" ] || [ "$OUT" = "." ]; then
  echo "Usage: script/assemble_site.sh <out_dir>  (out_dir must not be empty, '/' or '.')" >&2
  exit 1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
for pkg in djangobuilder5 djangobuilder.io djangobuilder4; do
  if [ ! -f "$ROOT/packages/$pkg/dist/index.html" ]; then
    echo "Missing packages/$pkg/dist/index.html - run the builds first (e.g. bun run build_development)" >&2
    exit 1
  fi
done

rm -rf "$OUT"
mkdir -p "$OUT/legacy" "$OUT/db4"
cp -R "$ROOT/packages/djangobuilder5/dist/." "$OUT/"
cp -R "$ROOT/packages/djangobuilder.io/dist/." "$OUT/legacy/"
cp -R "$ROOT/packages/djangobuilder4/dist/." "$OUT/db4/"
echo "Assembled site in $OUT (/ , /legacy/ , /db4/)"
```

Then `chmod +x script/assemble_site.sh`.

- [x] **Step 2: Verify the guard rails**

Run: `./script/assemble_site.sh` → expected exit 1 with the usage line.
Run: `./script/assemble_site.sh /` → expected exit 1 with the usage line.

- [x] **Step 3: Rewrite the deploy script**

```bash
#!/bin/bash
# Build all three apps, assemble the hosting site and deploy it to the named
# Firebase project alias (see .firebaserc).
# Usage: script/deploy.sh <development|staging|production>
set -euo pipefail

NAME=${1:-}
if [ -z "$NAME" ]; then
  echo "Usage: script/deploy.sh <development|staging|production>" >&2
  exit 1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

bunx firebase use "$NAME"
echo "Deploying $NAME"

bun run "build_$NAME"
./script/assemble_site.sh "dist_$NAME"
bunx firebase deploy --public="dist_$NAME"
```

- [x] **Step 4: Point the Makefile at the script and add `serve_site`**

Replace the whole `deploy:` recipe and the first line so they read:

```make
PHONY: build deploy serve_site smoke_test
```

```make
deploy:
ifeq "$(name)" ""
	@echo "Specify name e.g. make deploy name=staging" && exit 1
else
	./script/deploy.sh $(name)
endif

# Build everything, assemble the site into ./dist (firebase.json hosting.public)
# and serve it on http://localhost:8082 with the real rewrites and redirects.
serve_site:
	bun run build_development
	./script/assemble_site.sh dist
	bunx firebase emulators:start --only hosting --project development
```

(Makefile recipes must be indented with a tab.)

- [x] **Step 5: Commit**

```bash
git add script/assemble_site.sh script/deploy.sh Makefile
git commit -m "build: single assemble step shared by deploy and a local serve_site target"
```

---

### Task 2: Flip the bases and the hosting config, then run it locally

**Files:**
- Modify: `packages/djangobuilder5/package.json` (scripts)
- Modify: `packages/djangobuilder.io/package.json` (scripts.build)
- Modify: `firebase.json` (hosting)
- Delete: `packages/djangobuilder.io/firebase.json`

- [x] **Step 1: Remove `--base=/db5/` from djangobuilder5**

In `packages/djangobuilder5/package.json` the six scripts become:

```json
"build": "tsc --noEmit && vite build",
"build:development": "tsc --noEmit && vite build --mode=development",
"build:staging": "tsc --noEmit && vite build --mode=staging",
"build-only": "vite build",
"build-only:development": "vite build --mode=development",
"build-only:staging": "vite build --mode=staging",
```

- [x] **Step 2: Add `--base=/legacy/` to djangobuilder.io**

In `packages/djangobuilder.io/package.json`:

```json
"build": "vite build --base=/legacy/",
```

- [x] **Step 3: Rewrite the hosting section of `firebase.json`**

```json
"hosting": {
  "public": "dist/",
  "ignore": [
    "firebase.json",
    "**/.*",
    "**/node_modules/**"
  ],
  "redirects": [
    { "source": "/db5", "destination": "/", "type": 301 },
    { "source": "/db5/**", "destination": "/", "type": 301 }
  ],
  "rewrites": [
    { "source": "legacy/**", "destination": "/legacy/index.html" },
    { "source": "db4/**", "destination": "/db4/index.html" },
    { "source": "**", "destination": "/index.html" }
  ]
},
```

Leave `firestore` and `emulators` unchanged. Then `git rm packages/djangobuilder.io/firebase.json`.

- [x] **Step 4: Build and assemble**

Run: `bun run build_development && ./script/assemble_site.sh dist`
Expected: three builds succeed; `Assembled site in dist (/ , /legacy/ , /db4/)`.

- [x] **Step 5: Check the base paths landed in the right files**

```bash
grep -o 'src="/assets/[^"]*"' dist/index.html
grep -o 'href="/legacy/assets/[^"]*"' dist/legacy/index.html | head -1
grep -o 'src="/db4/assets/[^"]*"' dist/db4/index.html
! grep -q '/db5/' dist/index.html && echo "root index has no /db5/ refs"
```

Expected: one match each, and the final echo.

- [x] **Step 6: Serve locally and probe the routing**

Start in the background: `bunx firebase emulators:start --only hosting --project development` (or `make serve_site`, which also rebuilds). Then:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:8082/db5/anything   # 301 → http://localhost:8082/
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:8082/legacy         # 301 → .../legacy/
curl -s http://localhost:8082/project/abc | grep -c 'src="/assets/'                             # ≥1 (db5 index via catch-all)
curl -s http://localhost:8082/legacy/whatever | grep -c '/legacy/assets/'                       # ≥1 (legacy index via rewrite)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8082/legacy/favicon-32x32.png          # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8082/db4/                             # 200
```

Then open `http://localhost:8082/` and `http://localhost:8082/legacy/` in a browser (Playwright screenshot is fine) and confirm the db5 splash and the Vue splash render. Stop the emulator afterwards.

- [x] **Step 7: Commit**

```bash
git add packages/djangobuilder5/package.json packages/djangobuilder.io/package.json firebase.json
git rm -q packages/djangobuilder.io/firebase.json
git commit -m "feat: serve djangobuilder5 at / and djangobuilder.io at /legacy/"
```

---

### Task 3: djangobuilder5 legacy hash shim

**Files:**
- Create: `packages/djangobuilder5/src/lib/legacyHash.ts`
- Create: `packages/djangobuilder5/src/lib/legacyHash.test.ts`
- Modify: `packages/djangobuilder5/src/main.tsx`
- Modify: `packages/djangobuilder5/src/domain/firestore/auth.ts:31-35`, `packages/djangobuilder5/src/lib/firebase.ts:18`

- [x] **Step 1: Write the failing tests**

`packages/djangobuilder5/src/lib/legacyHash.test.ts`:

```ts
import { describe, expect, test, vi } from "vitest";
import { legacyHashToPath, redirectLegacyHash } from "./legacyHash";

describe("legacyHashToPath", () => {
  test.each([
    ["#/project/abc123", "/project/abc123"],
    ["#/project/abc123/", "/project/abc123"],
    ["#/home", "/projects"],
    ["#/login", "/login"],
    ["#/login/", "/login"],
    ["#/signup", "/signup"],
    ["#/about", "/about"],
    ["#/unverified", "/unverified"],
    ["#/reset_password", "/reset"],
    ["#/action?mode=verifyEmail&oobCode=XYZ", "/action?mode=verifyEmail&oobCode=XYZ"],
    ["#/verify/XYZ", "/action?mode=verifyEmail&oobCode=XYZ"],
    ["#/reset/XYZ", "/action?mode=resetPassword&oobCode=XYZ"],
    ["#/", "/"],
    ["#/error", "/"],
    ["#/debug", "/"],
    ["#/something/else", "/"],
  ])("maps %s to %s", (hash, expected) => {
    expect(legacyHashToPath(hash)).toBe(expected);
  });

  test.each([[""], ["#"], ["#section"], ["#foo/bar"]])("returns null for %j", (hash) => {
    expect(legacyHashToPath(hash)).toBeNull();
  });
});

describe("redirectLegacyHash", () => {
  test("rewrites a legacy hash URL in place at the app base", () => {
    const history = { replaceState: vi.fn() };
    const result = redirectLegacyHash({ pathname: "/", hash: "#/project/abc" }, history, "/");
    expect(result).toBe("/project/abc");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/project/abc");
  });

  test("prefixes a non-root base", () => {
    const history = { replaceState: vi.fn() };
    expect(redirectLegacyHash({ pathname: "/db5/", hash: "#/login/" }, history, "/db5/")).toBe("/db5/login");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/db5/login");
  });

  test("does nothing off the base path or without a legacy hash", () => {
    const history = { replaceState: vi.fn() };
    expect(redirectLegacyHash({ pathname: "/about", hash: "#/login" }, history, "/")).toBeNull();
    expect(redirectLegacyHash({ pathname: "/", hash: "" }, history, "/")).toBeNull();
    expect(history.replaceState).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run to verify failure**

Run: `bun run --filter=djangobuilder5 test -- src/lib/legacyHash.test.ts`
Expected: FAIL, cannot resolve `./legacyHash`.

- [x] **Step 3: Implement**

`packages/djangobuilder5/src/lib/legacyHash.ts`:

```ts
/**
 * Translate a djangobuilder.io hash-router URL (`/#/project/abc`, `/#/login/`,
 * `/#/action?mode=…`) into the equivalent djangobuilder5 path.
 *
 * Returns `null` when there is nothing to translate (no `#/…` hash). Unknown
 * legacy routes map to `/` so old bookmarks always land somewhere sensible.
 */
export function legacyHashToPath(hash: string): string | null {
  if (!hash.startsWith("#/")) return null;
  const [rawPath, query = ""] = hash.slice(1).split("?", 2);
  const [head, second] = rawPath.split("/").filter(Boolean);
  const search = query ? `?${query}` : "";

  switch (head) {
    case undefined:
      return "/";
    case "project":
      return second ? `/project/${second}` : "/projects";
    case "home":
      return "/projects";
    case "login":
    case "signup":
    case "about":
    case "unverified":
      return `/${head}`;
    case "reset_password":
      return "/reset";
    case "action":
      return `/action${search}`;
    case "verify":
      return second ? `/action?mode=verifyEmail&oobCode=${encodeURIComponent(second)}` : "/";
    case "reset":
      return second ? `/action?mode=resetPassword&oobCode=${encodeURIComponent(second)}` : "/";
    default:
      return "/";
  }
}

type LocationLike = Pick<Location, "pathname" | "hash">;
type HistoryLike = Pick<History, "replaceState">;

/**
 * If the page was opened at the app base with a legacy hash URL, rewrite the
 * address in place (no new history entry) so the router starts on the right
 * route. Returns the URL it switched to, or null when nothing was done.
 */
export function redirectLegacyHash(
  location: LocationLike = window.location,
  history: HistoryLike = window.history,
  base: string = import.meta.env.BASE_URL,
): string | null {
  if (location.pathname !== base) return null;
  const target = legacyHashToPath(location.hash);
  if (target === null) return null;
  const url = `${base.replace(/\/$/, "")}${target}`;
  history.replaceState(null, "", url);
  return url;
}
```

- [x] **Step 4: Run to verify pass**

Run: `bun run --filter=djangobuilder5 test -- src/lib/legacyHash.test.ts`
Expected: all tests PASS.

- [x] **Step 5: Wire it into `main.tsx` and reword the stale comments**

`packages/djangobuilder5/src/main.tsx` — add the import and call it before `initAuth()`:

```ts
import { redirectLegacyHash } from "@/lib/legacyHash";
// …
applyTheme(getInitialTheme());
redirectLegacyHash(); // old djangobuilder.io `/#/…` links → our routes, before the router mounts
initAuth();
```

`packages/djangobuilder5/src/domain/firestore/auth.ts` — replace the two comment lines above `verifyActionSettings` with:

```ts
// Built from import.meta.env.BASE_URL so the continue URL stays correct even if
// the app is ever served under a subpath again (it is "/" at the site root).
```

`packages/djangobuilder5/src/lib/firebase.ts:18` — replace the comment with:

```ts
// Keep users signed in across sessions (the legacy Vue app shares this auth state).
```

- [x] **Step 6: Run the db5 suite, lint and type-check**

Run: `bun run test_v5 && bun run lint_v5 && bun run --filter=djangobuilder5 type-check`
Expected: all green.

- [x] **Step 7: Commit**

```bash
git add packages/djangobuilder5/src/lib/legacyHash.ts packages/djangobuilder5/src/lib/legacyHash.test.ts packages/djangobuilder5/src/main.tsx packages/djangobuilder5/src/domain/firestore/auth.ts packages/djangobuilder5/src/lib/firebase.ts
git commit -m "feat(db5): translate legacy /#/ URLs into app routes at startup"
```

---

### Task 4: djangobuilder5 About page links to `/legacy/`

**Files:**
- Modify: `packages/djangobuilder5/src/features/about/AboutView.tsx`
- Modify: `packages/djangobuilder5/src/features/about/AboutView.test.tsx`

- [x] **Step 1: Add the failing assertion**

Append to `AboutView.test.tsx`:

```tsx
test("links to the legacy app at /legacy/", () => {
  render(
    <MemoryRouter>
      <AboutView />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: /legacy django builder/i })).toHaveAttribute("href", "/legacy/");
});
```

- [x] **Step 2: Run to verify failure**

Run: `bun run --filter=djangobuilder5 test -- src/features/about`
Expected: FAIL, no link with that name.

- [x] **Step 3: Add the link**

In `AboutView.tsx`, after the closing `</div>` of the Support box and before `</section>`:

```tsx
      <p className="mt-8 text-sm text-muted">
        Looking for the previous version?{" "}
        {/* Plain anchor: the legacy app is a separate site under /legacy/, not a router route. */}
        <a href="/legacy/" className="text-accent hover:text-text">
          Open the legacy Django Builder
        </a>
      </p>
```

- [x] **Step 4: Run to verify pass**

Run: `bun run --filter=djangobuilder5 test -- src/features/about`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/djangobuilder5/src/features/about/AboutView.tsx packages/djangobuilder5/src/features/about/AboutView.test.tsx
git commit -m "feat(db5): link to the legacy app from About"
```

---

### Task 5: Legacy app base-aware continue URL

**Files:**
- Modify: `packages/djangobuilder.io/src/firebase_utils.js`
- Create: `packages/djangobuilder.io/tests/unit/firebase_utils.spec.js`
- Modify: `packages/djangobuilder.io/src/components/SignUp.vue:32,52`
- Modify: `packages/djangobuilder.io/src/components/UnVerified.vue:31,46`

- [x] **Step 1: Write the failing test**

`packages/djangobuilder.io/tests/unit/firebase_utils.spec.js`:

```js
import { emailActionContinueUrl } from '@/firebase_utils'

afterEach(() => vi.unstubAllEnvs())

test('continue url points at the legacy login when built under /legacy/', () => {
  vi.stubEnv('BASE_URL', '/legacy/')
  expect(emailActionContinueUrl()).toBe(window.location.origin + '/legacy/#/login/')
})

test('continue url points at the root login in dev', () => {
  vi.stubEnv('BASE_URL', '/')
  expect(emailActionContinueUrl()).toBe(window.location.origin + '/#/login/')
})
```

- [x] **Step 2: Run to verify failure**

Run: `cd packages/djangobuilder.io && bunx vitest --run tests/unit/firebase_utils.spec.js`
Expected: FAIL, `emailActionContinueUrl` is not a function.

- [x] **Step 3: Implement the helper**

`packages/djangobuilder.io/src/firebase_utils.js` becomes:

```js

const userVerified = (user) => {
  const githubVerified = user.providerData.find(
    (p) => p.providerId === 'github.com'
  )
  return githubVerified !== undefined || user.emailVerified || user.isAnonymous
}

// Where Firebase sends a user after they click an email verification link.
// import.meta.env.BASE_URL is '/' in dev and '/legacy/' in the built app, so
// the link comes back to this (hash-routed) app rather than the root app.
const emailActionContinueUrl = () =>
  window.location.origin + import.meta.env.BASE_URL + '#/login/'

export {userVerified, emailActionContinueUrl}
```

- [x] **Step 4: Run to verify pass**

Run: `cd packages/djangobuilder.io && bunx vitest --run tests/unit/firebase_utils.spec.js`
Expected: PASS.

- [x] **Step 5: Use it in the two components**

`SignUp.vue`: add `import {emailActionContinueUrl} from '@/firebase_utils'` under the existing firebase import, and change line 52 to
`const actionCodeSettings = {url: emailActionContinueUrl()}`.

`UnVerified.vue`: same import, and change line 46 to
`const actionCodeSettings = {url: emailActionContinueUrl()}`.

Confirm: `grep -rn "'/#/login/'" packages/djangobuilder.io/src` → only `firebase_utils.js`.

- [x] **Step 6: Run the io tests and lint**

Run: `bun run test_io && bun run lint_io`
Expected: green (existing snapshot tests unchanged).

- [x] **Step 7: Commit**

```bash
git add packages/djangobuilder.io/src/firebase_utils.js packages/djangobuilder.io/tests/unit/firebase_utils.spec.js packages/djangobuilder.io/src/components/SignUp.vue packages/djangobuilder.io/src/components/UnVerified.vue
git commit -m "fix(io): email continue URL follows the app base (/legacy/)"
```

---

### Task 6: Legacy banner, manifest icons, tab title

**Files:**
- Create: `packages/djangobuilder.io/src/components/LegacyBanner.vue`
- Create: `packages/djangobuilder.io/tests/unit/components/LegacyBanner.spec.js`
- Modify: `packages/djangobuilder.io/src/components/MainContent.vue:180-205` (template), `:359` (data), `:397-401` (method), `:312-314` (style)
- Modify: `packages/djangobuilder.io/public/site.webmanifest`
- Modify: `packages/djangobuilder.io/index.html:12`

Note: `MainContent.vue` already shows a dismissible "may be end-of-lifed soon" `v-alert`. The new banner replaces it in the same slot, because "a new version exists at /" supersedes that message. Its `eol_banner` state, `dismissEolBanner` method and `.eol-banner` style go with it.

- [x] **Step 1: Write the failing tests**

`packages/djangobuilder.io/tests/unit/components/LegacyBanner.spec.js`:

```js
import { mount } from '@vue/test-utils'
import LegacyBanner from '@/components/LegacyBanner.vue'

beforeEach(() => localStorage.clear())

test('links to the new app at the site root', () => {
  const wrapper = mount(LegacyBanner)
  expect(wrapper.get('a').attributes('href')).toBe('/')
  expect(wrapper.text()).toContain('legacy Django Builder')
})

test('dismissing hides the banner and persists across mounts', async () => {
  const wrapper = mount(LegacyBanner)
  await wrapper.get('button').trigger('click')
  expect(wrapper.find('a').exists()).toBe(false)
  expect(localStorage.getItem('legacy_banner_dismissed')).toBe('true')
  expect(mount(LegacyBanner).find('a').exists()).toBe(false)
})
```

- [x] **Step 2: Run to verify failure**

Run: `cd packages/djangobuilder.io && bunx vitest --run tests/unit/components/LegacyBanner.spec.js`
Expected: FAIL, cannot resolve `LegacyBanner.vue`.

- [x] **Step 3: Create the component**

`packages/djangobuilder.io/src/components/LegacyBanner.vue`:

```vue
<template>
  <div v-if="visible" class="legacy-banner d-flex align-center px-4 py-2" role="status">
    <span class="flex-grow-1">
      You're using the legacy Django Builder.
      <a href="/" class="legacy-banner__link font-weight-bold ml-1">Try the new version</a>
    </span>
    <button type="button" class="legacy-banner__dismiss ml-4" aria-label="Dismiss" @click="dismiss">&times;</button>
  </div>
</template>

<script>
const STORAGE_KEY = 'legacy_banner_dismissed'

export default {
  name: 'LegacyBanner',
  data () {
    return {
      visible: localStorage.getItem(STORAGE_KEY) !== 'true',
    }
  },
  methods: {
    dismiss () {
      localStorage.setItem(STORAGE_KEY, 'true')
      this.visible = false
    },
  },
}
</script>

<style scoped>
.legacy-banner {
  background: #263238;
  color: #fff;
}
.legacy-banner__link {
  color: #ffab40;
}
.legacy-banner__dismiss {
  background: none;
  border: 0;
  color: inherit;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}
</style>
```

- [x] **Step 4: Run to verify pass**

Run: `cd packages/djangobuilder.io && bunx vitest --run tests/unit/components/LegacyBanner.spec.js`
Expected: PASS.

- [x] **Step 5: Mount it in `MainContent.vue` in place of the EOL alert**

Replace lines 180–205 (the whole `<v-alert v-if="eol_banner" …>…</v-alert>` block) with:

```vue
        <legacy-banner />
```

Add the import next to the other imports (around line 329):

```js
import LegacyBanner from '@/components/LegacyBanner.vue'
```

Register it on the component options object (next to `mixins: [addProjectMixin]`):

```js
  components: { 'legacy-banner': LegacyBanner },
```

Delete `eol_banner: localStorage.eol_banner_dismissed !== 'true',` from `data()`, delete the `dismissEolBanner` method, and delete the `.eol-banner { border-radius: 0 !important; }` style rule.

Confirm: `grep -n eol packages/djangobuilder.io/src/components/MainContent.vue` → no output.

- [x] **Step 6: Relative manifest icons and the tab title**

`packages/djangobuilder.io/public/site.webmanifest`:

```json
{"name":"","short_name":"","icons":[{"src":"android-chrome-192x192.png","sizes":"192x192","type":"image/png"},{"src":"android-chrome-512x512.png","sizes":"512x512","type":"image/png"}],"theme_color":"#ffffff","background_color":"#ffffff","display":"standalone"}
```

`packages/djangobuilder.io/index.html` line 12:

```html
    <title>Django Builder (Legacy)</title>
```

- [x] **Step 7: Run io tests, lint and a build**

Run: `bun run test_io && bun run lint_io && bun run build_io_development`
Expected: green; the build's `dist/index.html` contains `Django Builder (Legacy)`.

- [x] **Step 8: Commit**

```bash
git add packages/djangobuilder.io/src/components/LegacyBanner.vue packages/djangobuilder.io/tests/unit/components/LegacyBanner.spec.js packages/djangobuilder.io/src/components/MainContent.vue packages/djangobuilder.io/public/site.webmanifest packages/djangobuilder.io/index.html
git commit -m "feat(io): legacy banner linking to the new app, relative manifest icons, (Legacy) title"
```

---

### Task 7: CI assembles the site and asserts the layout

**Files:**
- Modify: `.github/workflows/ci.yml` (the `build` job)

- [x] **Step 1: Replace the three upload steps**

In the `build` job, after `- run: bun run build`, replace the three `Upload … dist directory` steps with:

```yaml
      - name: Assemble hosting site and check layout
        run: |
          ./script/assemble_site.sh dist_ci
          test -f dist_ci/index.html
          test -f dist_ci/legacy/index.html
          test -f dist_ci/db4/index.html
          grep -q 'src="/assets/' dist_ci/index.html
          ! grep -q '/db5/' dist_ci/index.html
          grep -q '/legacy/assets/' dist_ci/legacy/index.html
          grep -q '/db4/assets/' dist_ci/db4/index.html

      - name: Upload assembled site
        uses: actions/upload-artifact@v4
        with:
          name: site_dist
          path: ./dist_ci
```

- [x] **Step 2: Run the same shell block locally against a production build**

Run: `bun run build && ./script/assemble_site.sh dist_ci && test -f dist_ci/legacy/index.html && grep -q 'src="/assets/' dist_ci/index.html && ! grep -q '/db5/' dist_ci/index.html && grep -q '/legacy/assets/' dist_ci/legacy/index.html && grep -q '/db4/assets/' dist_ci/db4/index.html && echo LAYOUT OK && rm -rf dist_ci`
Expected: `LAYOUT OK`.

- [x] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: assemble the hosting site and assert the /, /legacy/, /db4/ layout"
```

---

### Task 8: Docs

**Files:**
- Create: `docs/deployment.md`
- Modify: `README.md` (deploy section), `AGENTS.md`, `docs/packages-and-code-layout.md`, `docs/how-to-write-a-feature.md`, `docs/how-to-write-tests.md`

- [x] **Step 1: Write `docs/deployment.md`**

````markdown
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

`firebase.json` rewrites `legacy/**` and `db4/**` to their own `index.html` and everything
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
````

- [x] **Step 2: README deploy section**

Replace the "### Deploy development" block with:

````markdown
### Run the whole site locally
```
make serve_site
```
Serves djangobuilder5 at http://localhost:8082/, the legacy app at `/legacy/` and
djangobuilder4 at `/db4/` on the Firebase hosting emulator.

### Deploy
```
make deploy name=development
```
See [docs/deployment.md](docs/deployment.md) for the layout and the cut-over checklist.
````

- [x] **Step 3: AGENTS.md**

Add a bullet: `- [Deployment](docs/deployment.md)`.

- [x] **Step 4: Package docs**

`docs/packages-and-code-layout.md`, under "Top level", make the package lines:

```markdown
- `packages/djangobuilder.io`: the Vue 3 application, served at `/legacy/`.
- `packages/djangobuilder4`: the earlier Vue 3 rewrite, served at `/db4/`.
- `packages/djangobuilder5`: the React application, served at `/`. See `docs/deployment.md`.
```

`docs/how-to-write-a-feature.md`: add `- \`packages/djangobuilder5\`: the React app (served at \`/\`).` to the owning-package list, `- React app dev server: \`bun run dev5\`` to the commands, and change "the Vue 2 app" to "the Vue 3 app (legacy, served at `/legacy/`)".

`docs/how-to-write-tests.md`: add `- \`packages/djangobuilder5\`: Vitest + Testing Library; run with \`bun run test_v5\`.` under Packages and Commands, and change "Vue 2 app" to "Vue 3 app".

- [x] **Step 5: Commit**

```bash
git add docs/deployment.md README.md AGENTS.md docs/packages-and-code-layout.md docs/how-to-write-a-feature.md docs/how-to-write-tests.md
git commit -m "docs: deployment layout, local serve target and cut-over checklist"
```

---

### Task 9: Gates, development deploy, live verification

- [x] **Step 1: Full gates**

Run: `bun run lint && bun run test && bun run build && bun run --filter=djangobuilder5 type-check`
Expected: all green. If anything fails, fix it before deploying.

- [x] **Step 2: Deploy to development**

Run: `make deploy name=development`
Expected: ends with `Deploy complete!` and the hosting URL `https://django-builder-dev.web.app`.

- [x] **Step 3: Probe the live site**

```bash
H=https://django-builder-dev.web.app
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' $H/db5/anything      # 301 → $H/
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' $H/legacy            # 301 → $H/legacy/
curl -s $H/project/abc | grep -c 'src="/assets/'                                # ≥1
curl -s $H/legacy/whatever | grep -c '/legacy/assets/'                          # ≥1
curl -s -o /dev/null -w '%{http_code}\n' $H/legacy/site.webmanifest             # 200
curl -s -o /dev/null -w '%{http_code}\n' $H/db4/                               # 200
```

- [x] **Step 4: Browser checks (Playwright)**

1. `$H/` → db5 splash; "Start building" (anonymous) → dashboard → create a project → add an app → reload → still there. Note the project id.
2. `$H/#/project/<id>` → URL becomes `/project/<id>` and the builder opens.
3. `$H/legacy/` → Vue splash with the banner; banner link href is `/`; favicon and manifest requests are 200.
4. `$H/legacy/#/project/<id>` → the legacy project view for the same project (shared auth + data).
5. `$H/about` → the "Open the legacy Django Builder" link has href `/legacy/`.
6. Screenshot `/` and `/legacy/`.

- [x] **Step 5: Report**

Summarise what was verified, what was not (staging/production, the console action URL), and hand over the branch. No commit needed for this task.
