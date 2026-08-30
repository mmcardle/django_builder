# Spec: `djangobuilder5` — UI/UX Redesign (Milestone 1, the look-locking slice)

Date: 2026-07-05

## Goal

Stand up a brand-new front-end package, **`packages/djangobuilder5`**, that replaces
the dated Vuetify UI with a slick, modern, **dark-first** experience built on
**React + Vite + TypeScript + Tailwind v4 + shadcn/ui**. Milestone 1 delivers a
*vertical slice* that locks the visual language on the app's hardest screen (the
model builder), driven by the existing `@djangobuilder/core` engine.

This milestone is about **the look and the core interaction**, not backend parity.
Firebase auth and Firestore persistence are explicitly deferred to a later milestone.

Nothing in `packages/djangobuilder.io` or `packages/djangobuilder4` is modified or
removed. `djangobuilder5` is additive.

## Decisions (agreed)

- **New package, new stack.** Ditch Vue and Vuetify for this app. `djangobuilder5`
  is React 19 + Vite 6 + TypeScript, Tailwind v4, shadcn/ui (Radix primitives).
  shadcn components are **copied into the repo and owned** — not a locked dependency.
- **Shared engine reused unchanged.** All Django generation and the `.tar` project
  export come from `@djangobuilder/core` (framework-agnostic TS). The UI is a new
  client of that engine; no generation logic is reimplemented.
- **Aesthetic = Direction B ("Modern Dev SaaS").** Refined charcoal surfaces, one
  confident accent, subtle gradients + accent glow, sans UI with mono only for code.
- **Signature accent = Emerald `#3ECF8E`** — polished but quietly on-brand for Django.
- **Dark-first with a light variant** and a persisted header toggle.
- **Splash = "Hero + live code preview"** — headline + dual CTA on the left, a real
  `models.py` panel with a working Copy button on the right.
- **Model builder = three-pane IDE** (tree · inline editor · live code + copy) as the
  primary experience. The **visual schema canvas is an optional view mode deferred**
  to a later milestone; the state model is designed so a canvas can read the same data.
- **Download whole project as `.tar` is preserved** as a first-class action, powered
  by `@djangobuilder/core`.
- **M1 data boundary: real core + local state.** Project state lives in memory /
  `localStorage`; the builder is fully interactive and generates real code with **no
  login required**. Firebase auth + Firestore sync are Milestone 2.
- **Defaults chosen:** state = **Zustand**; routing = **React Router**; UI font =
  **Inter**; code font = **JetBrains Mono** (both self-hosted, no CDN); syntax
  highlighting = **Shiki**, themed to our coding-palette tokens.

## Non-goals (out of scope for M1)

- Firebase authentication and Firestore persistence (→ M2).
- The projects **dashboard**/home grid, auth screens, settings/about, and porting
  every legacy dialog.
- The **canvas / ERD** view mode.
- Production routing, deploy wiring, and Firebase hosting config changes.
- Removing or altering `djangobuilder.io` / `djangobuilder4`.

## Architecture

### Package placement
- New workspace `packages/djangobuilder5` in the existing Bun workspace
  (`packages/*`). Installed and built through Bun; bundled by Vite (matches repo
  convention). Consumes `@djangobuilder/core` via the workspace dependency.
- Root `package.json` gains parallel scripts mirroring the other apps:
  `dev5`, `build_v5`, `lint_v5`, `test_v5` (wired into the aggregate `lint` / `test`
  once the package has real coverage).

### Layers (each unit has one clear purpose)
1. **Design-system layer** (`src/design/` + `src/components/ui/`) — tokens, theme
   provider, and the themed shadcn primitives. Knows nothing about Django.
2. **Domain adapter** (`src/domain/`) — a thin typed wrapper around
   `@djangobuilder/core`: takes the local `Project` state and returns generated
   file contents + the `.tar` blob. The only module that imports core.
3. **State** (`src/store/`) — Zustand store holding the current `Project`
   (apps → models → fields → relationships), persisted to `localStorage`. Pure data;
   no rendering. Shaped so a future canvas view and future Firestore sync both read it.
4. **Feature screens** (`src/features/`) — `splash/`, `builder/`. Compose the design
   system + state + domain adapter. No screen talks to core directly.
5. **App shell** (`src/app/`) — router, top nav, theme toggle, layout.

### Data flow (builder)
`User edits field` → Zustand `Project` update → `localStorage` persist →
domain adapter calls `@djangobuilder/core` → generated file strings → right-pane
`CodeBlock` re-renders (Shiki) → Copy / Download `.tar` act on that output.

## Design system

### Tokens (CSS variables → Tailwind theme)
- **Surfaces (dark):** base `#0B0D12`, surface `#14171F`, surface-2 `#1A1E28`,
  border `rgba(255,255,255,.08)`.
- **Text:** primary `#E6E8EE`, muted `#9BA3B4`.
- **Accent (emerald):** `#3ECF8E`; ink-on-accent `#04231A`; dim `#2BA871`; plus a
  soft tint + glow derived via `color-mix`.
- **Light variant:** same token names, remapped to a light surface ramp + adjusted
  accent contrast. Toggled by a `data-theme` attribute on `<html>`; choice persisted.
- **Coding palette (first-class tokens, reused everywhere code appears):**
  keyword `#C792EA`, class/model `#3ECF8E`, type/field `#82AAFF`, string `#ECC48D`,
  comment `#637777`. A Shiki theme is generated from these tokens so highlighted code
  and inline code share one source of truth.

### Type, shape, motion
- **Inter** (UI) + **JetBrains Mono** (code), self-hosted via `@fontsource`.
- Radii ~10px; soft shadows; subtle accent glow on primary; 150ms transitions.

### Components (themed shadcn + one bespoke)
- shadcn, retokenized: Button, Input, Select, Dialog, DropdownMenu, Tabs, Tooltip,
  Switch (theme toggle), Toast.
- **Bespoke `CodeBlock`** — the centerpiece: optional file tabs, Shiki highlighting
  in our palette, and the **copy helper** (per-block copy + "Copied ✓" feedback). One
  primitive reused by the splash and the builder's right pane.

## Screens

### App shell (`src/app/`)
Top nav (brand wordmark, primary nav, Sign-in placeholder link, **theme toggle**),
`<main>` router outlet, minimal footer. Replaces the Vuetify app-bar/drawer chrome.

### Splash — Hero + live code preview (`src/features/splash/`)
- Left: headline, sub-lede, primary CTA ("Start building — free") + secondary
  ("Live demo"), tech chips (Django 5 / DRF / HTMX / Channels).
- Right: a `CodeBlock` showing a real generated `models.py` with a working Copy button.
- Emerald-on-charcoal, subtle top-right accent gradient. Matches the approved mockup.

### Model builder — three-pane IDE (`src/features/builder/`)
- **Left pane:** apps → models tree; add/select app and model.
- **Center pane:** inline editor for the selected model — field rows (name, type,
  options) with add/edit/remove **inline** (no dialogs), plus relationships.
- **Right pane:** live generated code in a `CodeBlock` with **file tabs**
  (models.py / admin.py / views.py / serializers.py / urls.py as core provides),
  per-file **Copy**, and a **Download `.tar`** button for the whole project.
- Every edit regenerates via `@djangobuilder/core`. A small seed project is loaded on
  first visit so the screen is immediately alive.

### Copy-code helpers (explicit requirement)
- Shared primitive: per-block copy and per-file copy, with "Copied ✓" feedback
  (inline + Toast). Present on the splash and throughout the builder's right pane.

## Testing

Per `docs/how-to-write-tests.md`, using **Vitest + React Testing Library** (new to
this package; wired into `test_v5`). Behavior-level coverage for:
- `CodeBlock` renders highlighted code and the copy action writes to the clipboard +
  shows feedback.
- Builder path: adding a model / field updates the Zustand `Project` **and** the
  generated code output (through the domain adapter over real `@djangobuilder/core`).
- Theme toggle flips `data-theme` and persists the choice.
- Domain adapter smoke: a known `Project` yields expected file names and a `.tar` blob.

State the `djangobuilder5` coverage explicitly in change summaries; do not claim
coverage for screens not yet tested.

## Verification

- Package lint: `bun run lint_v5` (and root `bun run lint` for cross-package changes).
- Type-check in the build flow (like `djangobuilder4`): `vue-tsc` equivalent → `tsc`.
- Package tests: `bun run test_v5`.
- Manual: `bun run dev5`, exercise splash → builder → add model/field → copy → download
  `.tar`, and toggle dark/light.

## Risks & mitigations

- **`@djangobuilder/core` ergonomics from React/TS.** Mitigation: the domain adapter
  isolates all core calls behind a small typed interface; if core needs a minor export
  or type tweak, that is a scoped core change (owning package = `lib/djangobuilder-core`).
- **Shiki bundle size.** Mitigation: fine-grained Shiki import limited to the Python
  grammar + our single generated theme; lazy-load the highlighter.
- **Scope creep toward parity.** Mitigation: the Non-goals list is binding for M1;
  auth/dashboard/canvas are separate milestones.
- **State model outliving M1.** Mitigation: the `Project` store is designed up front to
  be the single source both a canvas view and Firestore sync will read, avoiding a
  rewrite in M2/M3.

## Milestone map (context beyond M1)

- **M1 (this spec):** design system + shell + splash + three-pane builder, local state.
- **M2:** Firebase auth + Firestore persistence; projects dashboard.
- **M3:** optional canvas / ERD view mode; remaining screens; production routing/deploy.
