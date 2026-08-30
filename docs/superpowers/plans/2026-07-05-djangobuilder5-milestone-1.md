# djangobuilder5 — Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a new `packages/djangobuilder5` React app that locks the redesigned visual language on a working vertical slice — design system (dark-first + toggle, emerald accent, coding palette), app shell, hero splash with live code preview, and a three-pane IDE model builder — driven by the existing `@djangobuilder/core` engine with local state and no Firebase.

**Architecture:** A Vite + React + TypeScript SPA in the existing Bun workspace. Project state is a plain nested `LocalProject` object in a Zustand store (persisted to `localStorage`). A single `src/domain/` module is the only code that touches `@djangobuilder/core`: it converts `LocalProject` → core `DjangoProject`, renders per-file Django source for preview, and produces the `.tar`. Screens compose a small owned (shadcn-style) design system. No Firebase, no auth, no dashboard in M1.

**Tech Stack:** React 19, Vite 6, TypeScript 5.7, Tailwind v4 (`@tailwindcss/vite`), `class-variance-authority` + `clsx` + `tailwind-merge` (shadcn foundation), Zustand + immer, React Router, highlight.js (custom token-driven theme), Vitest + React Testing Library + jsdom. Reuses `@djangobuilder/core` (`Renderer`, `DjangoProject`, `FieldTypes`, `RelationshipTypes`, `BuiltInModelTypes`, `tarballURL`) unchanged.

**Deviation from spec (flag at review):** The spec named **Shiki** for highlighting; this plan uses **highlight.js with a custom CSS theme driven by our design tokens** instead. Rationale: it makes the coding palette *our* tokens, switches instantly with the dark/light toggle (pure CSS, no re-highlight), is synchronous (trivial in jsdom tests), and matches repo precedent (both existing apps use highlight.js). Same visual outcome, less risk. Also, M1's builder right-pane uses **fixed file tabs** (`models.py/admin.py/serializers.py/views.py/urls.py` via `renderAppFile`) rather than the full `asTree` file explorer, which is deferred to a later milestone.

**Key core API facts (verified):**
- Import only from `@djangobuilder/core` (its `src/index.ts`); never import `./cli` or `./smoketest` (they pull Node `fs`). This keeps the bundle browser-safe. The package's `main` is raw TypeScript, so Vite must transpile it — we add an explicit `resolve.alias` to the source + `optimizeDeps.exclude` (Task 1).
- Build: `new DjangoProject(name, description, version, {htmx, channels, postgres}, id)` → `project.addApp(name, [], id)` → `app.addModel(name, abstract, [], [], [], id)` → `model.addField(name, FieldTypes[typeName], args, editable, id)` / `model.addRelationship(name, RelationshipTypes[typeName], to, args, id)`.
- `DjangoVersion` enum: `DJANGO3 = 3.2`, `DJANGO4 = 4.1`, `DJANGO5 = 5.1`.
- Relationship `to` is a `BuiltInModel` (`BuiltInModelTypes["auth.User"]`) or another `DjangoModel` instance → build models first, add relationships in a second pass.
- Preview: `new Renderer().renderAppFile("models.py", app)` renders all models for that app; `models.py/admin.py/serializers.py/views.py/urls.py` are **app** files.
- Download: `new Renderer().tarballURL(project)` returns a `data:application/tar;base64,…` URI; anchor-click to download.

---

## File structure (created in M1)

```
packages/djangobuilder5/
  package.json                     Task 0
  index.html                       Task 0
  vite.config.ts                   Task 1
  vitest.config.ts                 Task 1
  tsconfig.json / tsconfig.node.json  Task 0
  eslint.config.js                 Task 0
  src/
    main.tsx                       Task 0 (stub) → Task 8 (router)
    vite-env.d.ts                  Task 0
    index.css                      Task 1 (tokens) + Task 6 (hljs theme)
    test/setup.ts                  Task 1
    lib/
      cn.ts                        Task 2
      theme.ts                     Task 3
      highlight.ts                 Task 6
    components/
      ui/Button.tsx                Task 2
      ui/Input.tsx                 Task 2
      ui/Select.tsx                Task 2
      ThemeToggle.tsx              Task 3
      CodeBlock.tsx                Task 6
      TopNav.tsx                   Task 8
    domain/
      types.ts                     Task 4
      seed.ts                      Task 4
      options.ts                   Task 4
      buildCoreProject.ts          Task 4
      generate.ts                  Task 5
    store/
      projectStore.ts              Task 7
    features/
      splash/Splash.tsx            Task 9
      builder/BuilderPage.tsx      Task 12
      builder/TreePane.tsx         Task 10
      builder/EditorPane.tsx       Task 11
      builder/CodePane.tsx         Task 12
    app/App.tsx                    Task 8
```

Root `package.json` gains `dev5 / build_v5 / lint_v5 / test_v5` scripts and folds `lint_v5`/`test_v5` into the aggregate `lint`/`test` (Task 13).

---

## Task 0: Scaffold the `djangobuilder5` package

**Files:**
- Create: `packages/djangobuilder5/package.json`
- Create: `packages/djangobuilder5/index.html`
- Create: `packages/djangobuilder5/tsconfig.json`
- Create: `packages/djangobuilder5/tsconfig.node.json`
- Create: `packages/djangobuilder5/eslint.config.js`
- Create: `packages/djangobuilder5/src/main.tsx`
- Create: `packages/djangobuilder5/src/vite-env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "djangobuilder5",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 8081",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 4175",
    "type-check": "tsc --noEmit -p tsconfig.json",
    "lint": "eslint ./src/",
    "lint:fix": "eslint ./src/ --fix",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@djangobuilder/core": "1.0.0",
    "@fontsource-variable/inter": "^5.1.0",
    "@fontsource-variable/jetbrains-mono": "^5.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "highlight.js": "^11.11.0",
    "immer": "^10.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "tailwind-merge": "^2.6.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.18.1",
    "vite": "^6.4.3",
    "vitest": "^3.2.6"
  }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Django Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Note: `skipLibCheck: true` keeps the raw-TS `@djangobuilder/core` dependency from failing our type-check on its internal `.d`-less modules. `allowImportingTsExtensions` + `moduleResolution: bundler` let Vite/Vitest resolve our `@/` paths and the aliased core source.

- [ ] **Step 4: Create `tsconfig.node.json`** (for Vite/Vitest config files)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Create `eslint.config.js`**

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
```

- [ ] **Step 6: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 7: Create `src/main.tsx`** (temporary stub; replaced in Task 8)

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <h1>djangobuilder5</h1>
  </StrictMode>,
);
```

- [ ] **Step 8: Install dependencies from repo root**

Run: `cd /home/mark/devel/django_builder && bun install`
Expected: completes without error; `packages/djangobuilder5/node_modules/@djangobuilder/core` links to `lib/djangobuilder-core`.

- [ ] **Step 9: Commit**

```bash
git add packages/djangobuilder5 bun.lock
git commit -m "feat(db5): scaffold djangobuilder5 React+Vite package"
```

---

## Task 1: Vite + Vitest config, Tailwind v4, and design tokens

**Files:**
- Create: `packages/djangobuilder5/vite.config.ts`
- Create: `packages/djangobuilder5/vitest.config.ts`
- Create: `packages/djangobuilder5/src/test/setup.ts`
- Create: `packages/djangobuilder5/src/index.css`
- Modify: `packages/djangobuilder5/src/main.tsx` (import the CSS)

- [ ] **Step 1: Create `vite.config.ts`**

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Monorepo env files live at repo root
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // @djangobuilder/core ships raw TS (main: src/index.ts). Alias directly to
      // source so Vite transpiles it; exclude from prebundling for the same reason.
      "@djangobuilder/core": fileURLToPath(
        new URL("../../lib/djangobuilder-core/src/index.ts", import.meta.url),
      ),
    },
  },
  optimizeDeps: { exclude: ["@djangobuilder/core"] },
});
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@djangobuilder/core": fileURLToPath(
        new URL("../../lib/djangobuilder-core/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Create `src/index.css`** with Tailwind v4 import + design tokens

```css
@import "tailwindcss";

/* ---- Design tokens (Direction B: Modern Dev SaaS, emerald accent) ---- */
:root,
[data-theme="dark"] {
  --bg: #0b0d12;
  --surface: #14171f;
  --surface-2: #1a1e28;
  --border: rgba(255, 255, 255, 0.08);
  --text: #e6e8ee;
  --text-muted: #9ba3b4;

  --accent: #3ecf8e;
  --accent-hover: #57e0a3;
  --accent-ink: #04231a;

  /* coding palette */
  --code-bg: #14171f;
  --code-text: #e6e8ee;
  --code-comment: #637777;
  --code-keyword: #c792ea;
  --code-class: #3ecf8e;
  --code-type: #82aaff;
  --code-string: #ecc48d;
  --code-number: #f78c6c;
}

[data-theme="light"] {
  --bg: #f7f8fa;
  --surface: #ffffff;
  --surface-2: #f0f2f5;
  --border: rgba(2, 8, 20, 0.1);
  --text: #10131a;
  --text-muted: #5a6472;

  --accent: #1f9d63;
  --accent-hover: #178a55;
  --accent-ink: #ffffff;

  --code-bg: #f4f6f8;
  --code-text: #10131a;
  --code-comment: #8792a2;
  --code-keyword: #8b3fd6;
  --code-class: #0f9d63;
  --code-type: #2b6cff;
  --code-string: #b5652a;
  --code-number: #c0562a;
}

/* Expose tokens to Tailwind v4 utilities (bg-bg, text-accent, etc.) */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-ink: var(--accent-ink);
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}

html,
body,
#root {
  height: 100%;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 5: Import the CSS in `src/main.tsx`** (add as the first import)

```tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <h1 className="p-8 text-accent">djangobuilder5</h1>
  </StrictMode>,
);
```

- [ ] **Step 6: Verify the dev server boots**

Run: `cd /home/mark/devel/django_builder && bun run dev5` (Ctrl-C after it prints the local URL)
Expected: Vite starts on `http://localhost:8081` with no config/transform errors. Optionally open it: an emerald "djangobuilder5" heading on a dark background confirms Tailwind + tokens are wired.

- [ ] **Step 7: Verify the production build passes** (proves core transpiles + type-check is green)

Run: `bun run build_v5` — *(this root script is added in Task 13; until then run)* `cd packages/djangobuilder5 && bun run build`
Expected: `tsc --noEmit` passes and `vite build` writes `dist/` with no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/djangobuilder5
git commit -m "feat(db5): vite/vitest config, tailwind v4, design tokens (dark+light)"
```

---

## Task 2: shadcn foundation — `cn`, Button, Input, Select

**Files:**
- Create: `packages/djangobuilder5/src/lib/cn.ts`
- Create: `packages/djangobuilder5/src/components/ui/Button.tsx`
- Create: `packages/djangobuilder5/src/components/ui/Input.tsx`
- Create: `packages/djangobuilder5/src/components/ui/Select.tsx`
- Test: `packages/djangobuilder5/src/components/ui/Button.test.tsx`

- [ ] **Step 1: Write the failing test** `src/components/ui/Button.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("renders children and applies the primary variant by default", () => {
  render(<Button>New Project</Button>);
  const btn = screen.getByRole("button", { name: "New Project" });
  expect(btn).toBeInTheDocument();
  expect(btn.className).toContain("bg-accent");
});

test("applies the ghost variant when requested", () => {
  render(<Button variant="ghost">Docs</Button>);
  expect(screen.getByRole("button", { name: "Docs" }).className).toContain("border");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- Button`
Expected: FAIL — cannot resolve `./Button`.

- [ ] **Step 3: Create `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create `src/components/ui/Button.tsx`**

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-ink hover:bg-accent-hover shadow-[0_6px_20px_rgba(62,207,142,0.28)]",
        ghost: "border border-border bg-transparent text-text hover:bg-surface-2",
        subtle: "bg-surface-2 text-text hover:bg-surface",
      },
      size: {
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
```

- [ ] **Step 5: Create `src/components/ui/Input.tsx`**

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text",
        "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
```

- [ ] **Step 6: Create `src/components/ui/Select.tsx`** (styled native select — accessible, minimal; Radix Select can replace it later)

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-9 rounded-lg border border-border bg-bg px-2 text-sm text-text",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- Button`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add packages/djangobuilder5/src/lib/cn.ts packages/djangobuilder5/src/components/ui
git commit -m "feat(db5): shadcn foundation — cn, Button, Input, Select"
```

---

## Task 3: Theme provider + ThemeToggle (dark-first + switcher)

**Files:**
- Create: `packages/djangobuilder5/src/lib/theme.ts`
- Create: `packages/djangobuilder5/src/components/ThemeToggle.tsx`
- Test: `packages/djangobuilder5/src/lib/theme.test.ts`
- Test: `packages/djangobuilder5/src/components/ThemeToggle.test.tsx`

- [ ] **Step 1: Write the failing test** `src/lib/theme.test.ts`

```ts
import { beforeEach, expect, test } from "vitest";
import { applyTheme, getInitialTheme, toggleTheme } from "./theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test("defaults to dark when nothing stored", () => {
  expect(getInitialTheme()).toBe("dark");
});

test("applyTheme sets the html attribute and persists", () => {
  applyTheme("light");
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(localStorage.getItem("db5-theme")).toBe("light");
});

test("toggleTheme flips dark <-> light and returns the new value", () => {
  applyTheme("dark");
  expect(toggleTheme()).toBe("light");
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(toggleTheme()).toBe("dark");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- theme`
Expected: FAIL — cannot resolve `./theme`.

- [ ] **Step 3: Create `src/lib/theme.ts`**

```ts
export type Theme = "dark" | "light";
const KEY = "db5-theme";

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(KEY, theme);
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- theme`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test** `src/components/ThemeToggle.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { ThemeToggle } from "./ThemeToggle";
import { applyTheme } from "@/lib/theme";

beforeEach(() => {
  localStorage.clear();
  applyTheme("dark");
});

test("clicking the toggle switches the document theme", async () => {
  render(<ThemeToggle />);
  await userEvent.click(screen.getByRole("button", { name: /theme/i }));
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- ThemeToggle`
Expected: FAIL — cannot resolve `./ThemeToggle`.

- [ ] **Step 7: Create `src/components/ThemeToggle.tsx`**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { currentTheme, toggleTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme());
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(toggleTheme())}
    >
      <span aria-hidden>{theme === "dark" ? "☾" : "☀"}</span>
    </Button>
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- ThemeToggle`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/djangobuilder5/src/lib/theme.ts packages/djangobuilder5/src/lib/theme.test.ts \
        packages/djangobuilder5/src/components/ThemeToggle.tsx packages/djangobuilder5/src/components/ThemeToggle.test.tsx
git commit -m "feat(db5): theme provider + toggle (dark-first, persisted)"
```

---

## Task 4: Domain types, seed project, options, and `buildCoreProject`

**Files:**
- Create: `packages/djangobuilder5/src/domain/types.ts`
- Create: `packages/djangobuilder5/src/domain/seed.ts`
- Create: `packages/djangobuilder5/src/domain/options.ts`
- Create: `packages/djangobuilder5/src/domain/buildCoreProject.ts`
- Test: `packages/djangobuilder5/src/domain/buildCoreProject.test.ts`

- [ ] **Step 1: Create `src/domain/types.ts`**

```ts
export type RelationshipTypeName = "ForeignKey" | "OneToOneField" | "ManyToManyField";

export interface LocalField {
  id: string;
  name: string;
  type: string; // key of FieldTypes, e.g. "CharField"
  args: string;
}

export interface LocalRelationship {
  id: string;
  name: string;
  type: RelationshipTypeName;
  to: string; // "auth.User" or "<appName>.<ModelName>"
  args: string;
}

export interface LocalModel {
  id: string;
  name: string;
  abstract: boolean;
  fields: LocalField[];
  relationships: LocalRelationship[];
}

export interface LocalApp {
  id: string;
  name: string;
  models: LocalModel[];
}

export interface LocalProject {
  id: string;
  name: string;
  description: string;
  djangoVersion: 3 | 4 | 5;
  channels: boolean;
  htmx: boolean;
  postgres: boolean;
  apps: LocalApp[];
}
```

- [ ] **Step 2: Create `src/domain/seed.ts`** (a real blog project so every screen is immediately alive)

```ts
import type { LocalProject } from "./types";

export function makeSeedProject(): LocalProject {
  return {
    id: "proj_seed",
    name: "Blog",
    description: "A starter blog project.",
    djangoVersion: 5,
    channels: false,
    htmx: true,
    postgres: false,
    apps: [
      {
        id: "app_blog",
        name: "blog",
        models: [
          {
            id: "model_post",
            name: "Post",
            abstract: false,
            fields: [
              { id: "f_title", name: "title", type: "CharField", args: "max_length=200" },
              { id: "f_body", name: "body", type: "TextField", args: "blank=True" },
              { id: "f_created", name: "created", type: "DateTimeField", args: "auto_now_add=True" },
            ],
            relationships: [
              { id: "r_author", name: "author", type: "ForeignKey", to: "auth.User", args: "on_delete=models.CASCADE" },
            ],
          },
          {
            id: "model_comment",
            name: "Comment",
            abstract: false,
            fields: [{ id: "f_text", name: "text", type: "TextField", args: "" }],
            relationships: [
              { id: "r_post", name: "post", type: "ForeignKey", to: "blog.Post", args: "on_delete=models.CASCADE" },
            ],
          },
        ],
      },
    ],
  };
}
```

- [ ] **Step 3: Create `src/domain/options.ts`** (dropdown sources, derived from core — never hardcoded)

```ts
import { FieldTypes, RelationshipTypes } from "@djangobuilder/core";

export const fieldTypeNames: string[] = Object.keys(FieldTypes).sort();
export const relationshipTypeNames: string[] = Object.keys(RelationshipTypes);

/** Valid relationship targets for a project: auth.User plus every user model. */
export function relationshipTargets(
  apps: { name: string; models: { name: string }[] }[],
): string[] {
  const userModels = apps.flatMap((a) => a.models.map((m) => `${a.name}.${m.name}`));
  return ["auth.User", ...userModels];
}
```

- [ ] **Step 4: Write the failing test** `src/domain/buildCoreProject.test.ts`

```ts
import { expect, test } from "vitest";
import { Renderer } from "@djangobuilder/core";
import { buildCoreProject } from "./buildCoreProject";
import { makeSeedProject } from "./seed";

test("builds a core project mirroring the local structure", () => {
  const core = buildCoreProject(makeSeedProject());
  expect(core.name).toBe("Blog");
  expect(core.apps).toHaveLength(1);
  const app = core.apps[0];
  expect(app.name).toBe("blog");
  expect(app.models.map((m) => m.name)).toEqual(["Post", "Comment"]);
  const post = app.models[0];
  expect(post.fields.map((f) => f.name)).toEqual(["title", "body", "created"]);
  expect(post.relationships.map((r) => r.name)).toEqual(["author"]);
});

test("rendered models.py contains the generated Django class + field", () => {
  const core = buildCoreProject(makeSeedProject());
  const models = new Renderer().renderAppFile("models.py", core.apps[0]);
  expect(models).toContain("class Post(");
  expect(models).toContain("models.CharField");
  expect(models).toContain("max_length=200");
});

test("resolves a relationship targeting another user model", () => {
  const core = buildCoreProject(makeSeedProject());
  const comment = core.apps[0].models[1];
  // relatedTo() returns "app.Model" for a DjangoModel target
  expect(comment.relationships[0].relatedTo()).toContain("Post");
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- buildCoreProject`
Expected: FAIL — cannot resolve `./buildCoreProject`.

- [ ] **Step 6: Create `src/domain/buildCoreProject.ts`**

```ts
import {
  BuiltInModelTypes,
  DjangoModel,
  DjangoProject,
  DjangoVersion,
  FieldTypes,
  RelationshipTypes,
} from "@djangobuilder/core";
import type { LocalProject } from "./types";

function toDjangoVersion(v: 3 | 4 | 5): DjangoVersion {
  if (v === 3) return DjangoVersion.DJANGO3;
  if (v === 4) return DjangoVersion.DJANGO4;
  return DjangoVersion.DJANGO5;
}

/** Convert editable local state into a generation-ready core DjangoProject. */
export function buildCoreProject(project: LocalProject): DjangoProject {
  const core = new DjangoProject(
    project.name,
    project.description,
    toDjangoVersion(project.djangoVersion),
    { htmx: project.htmx, channels: project.channels, postgres: project.postgres },
    project.id,
  );

  const modelIndex = new Map<string, DjangoModel>();

  // Pass 1: apps, models, fields (relationship targets must exist first).
  for (const app of project.apps) {
    const coreApp = core.addApp(app.name, [], app.id);
    for (const model of app.models) {
      const coreModel = coreApp.addModel(model.name, model.abstract, [], [], [], model.id);
      for (const field of model.fields) {
        const fieldType = FieldTypes[field.type];
        if (!fieldType) throw new Error(`Unknown field type: ${field.type}`);
        const editable = field.args.indexOf("editable=False") === -1;
        coreModel.addField(field.name, fieldType, field.args, editable, field.id);
      }
      modelIndex.set(`${app.name}.${model.name}`, coreModel);
    }
  }

  // Pass 2: relationships.
  for (const app of project.apps) {
    const coreApp = core.apps.find((a) => a.name === app.name)!;
    for (const model of app.models) {
      const coreModel = coreApp.models.find((m) => m.name === model.name)!;
      for (const rel of model.relationships) {
        const relType = RelationshipTypes[rel.type];
        if (!relType) throw new Error(`Unknown relationship type: ${rel.type}`);
        const target =
          rel.to === "auth.User" ? BuiltInModelTypes["auth.User"] : modelIndex.get(rel.to);
        if (!target) throw new Error(`Unknown relationship target: ${rel.to}`);
        // `target` is a BuiltInModel or DjangoModel; both satisfy the core param type.
        coreModel.addRelationship(
          rel.name,
          relType,
          target as Parameters<DjangoModel["addRelationship"]>[2],
          rel.args,
          rel.id,
        );
      }
    }
  }

  return core;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- buildCoreProject`
Expected: PASS (3 tests). This proves the raw-TS core import, transpile, and generation all work under Vitest.

- [ ] **Step 8: Commit**

```bash
git add packages/djangobuilder5/src/domain
git commit -m "feat(db5): domain types, seed, options, buildCoreProject adapter"
```

---

## Task 5: Generation adapter — preview files + tar download

**Files:**
- Create: `packages/djangobuilder5/src/domain/generate.ts`
- Test: `packages/djangobuilder5/src/domain/generate.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/generate.test.ts`

```ts
import { expect, test, vi } from "vitest";
import {
  APP_PREVIEW_FILES,
  downloadProjectTar,
  projectTarUrl,
  renderAppPreview,
} from "./generate";
import { makeSeedProject } from "./seed";

test("renderAppPreview returns one entry per preview file, models.py first", () => {
  const files = renderAppPreview(makeSeedProject(), "app_blog");
  expect(files.map((f) => f.file)).toEqual([...APP_PREVIEW_FILES]);
  expect(files[0].code).toContain("class Post(");
});

test("renderAppPreview returns [] for an unknown app id", () => {
  expect(renderAppPreview(makeSeedProject(), "nope")).toEqual([]);
});

test("projectTarUrl returns a base64 tar data URI", () => {
  const url = projectTarUrl(makeSeedProject());
  expect(url.startsWith("data:application/tar;base64,")).toBe(true);
  expect(url.length).toBeGreaterThan(100);
});

test("downloadProjectTar clicks an anchor with the project filename", () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  downloadProjectTar(makeSeedProject());
  expect(click).toHaveBeenCalledOnce();
  click.mockRestore();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- generate`
Expected: FAIL — cannot resolve `./generate`.

- [ ] **Step 3: Create `src/domain/generate.ts`**

```ts
import { Renderer } from "@djangobuilder/core";
import { buildCoreProject } from "./buildCoreProject";
import type { LocalProject } from "./types";

export const APP_PREVIEW_FILES = [
  "models.py",
  "admin.py",
  "serializers.py",
  "views.py",
  "urls.py",
] as const;
export type PreviewFile = (typeof APP_PREVIEW_FILES)[number];

const renderer = new Renderer();

export function renderAppPreview(
  project: LocalProject,
  appId: string,
): { file: PreviewFile; code: string }[] {
  const core = buildCoreProject(project);
  const app = core.apps.find((a) => a.id === appId);
  if (!app) return [];
  return APP_PREVIEW_FILES.map((file) => ({ file, code: renderer.renderAppFile(file, app) }));
}

export function projectTarUrl(project: LocalProject): string {
  return renderer.tarballURL(buildCoreProject(project));
}

export function downloadProjectTar(project: LocalProject): void {
  const url = projectTarUrl(project);
  const link = document.createElement("a");
  link.download = `${project.name || "project"}.tar`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- generate`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/djangobuilder5/src/domain/generate.ts packages/djangobuilder5/src/domain/generate.test.ts
git commit -m "feat(db5): generation adapter — app preview files + tar download"
```

---

## Task 6: CodeBlock (highlight.js + token theme + tabs + copy)

**Files:**
- Create: `packages/djangobuilder5/src/lib/highlight.ts`
- Create: `packages/djangobuilder5/src/components/CodeBlock.tsx`
- Modify: `packages/djangobuilder5/src/index.css` (append the `.hljs` token theme)
- Test: `packages/djangobuilder5/src/lib/highlight.test.ts`
- Test: `packages/djangobuilder5/src/components/CodeBlock.test.tsx`

- [ ] **Step 1: Write the failing test** `src/lib/highlight.test.ts`

```ts
import { expect, test } from "vitest";
import { highlight, langForFile } from "./highlight";

test("langForFile maps extensions", () => {
  expect(langForFile("models.py")).toBe("python");
  expect(langForFile("base.html")).toBe("django");
  expect(langForFile("Makefile")).toBe("plaintext");
});

test("highlight wraps python keywords in hljs spans", () => {
  const html = highlight("class Post:\n    pass", "python");
  expect(html).toContain('class="hljs-keyword"');
});

test("highlight escapes plaintext without throwing", () => {
  expect(highlight("a < b && c", "plaintext")).toContain("&lt;");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- highlight`
Expected: FAIL — cannot resolve `./highlight`.

- [ ] **Step 3: Create `src/lib/highlight.ts`**

```ts
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import django from "highlight.js/lib/languages/django";

hljs.registerLanguage("python", python);
hljs.registerLanguage("django", django);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function langForFile(name: string): "python" | "django" | "plaintext" {
  if (name.endsWith(".py")) return "python";
  if (name.endsWith(".html")) return "django";
  return "plaintext";
}

export function highlight(code: string, lang: string): string {
  if (lang === "python" || lang === "django") {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return escapeHtml(code);
    }
  }
  return escapeHtml(code);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- highlight`
Expected: PASS (3 tests).

- [ ] **Step 5: Append the `.hljs` token theme to `src/index.css`** (drives highlight colors from our design tokens, so the palette flips with the theme toggle)

```css
/* ---- highlight.js theme, driven by coding-palette tokens ---- */
.hljs {
  color: var(--code-text);
  background: transparent;
}
.hljs-comment,
.hljs-quote {
  color: var(--code-comment);
  font-style: italic;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in {
  color: var(--code-keyword);
}
.hljs-title,
.hljs-title.class_,
.hljs-section {
  color: var(--code-class);
}
.hljs-type,
.hljs-title.function_,
.hljs-attr,
.hljs-attribute {
  color: var(--code-type);
}
.hljs-string,
.hljs-meta .hljs-string {
  color: var(--code-string);
}
.hljs-number,
.hljs-literal {
  color: var(--code-number);
}
```

- [ ] **Step 6: Write the failing test** `src/components/CodeBlock.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";

const files = [
  { file: "models.py", code: "class Post:\n    pass" },
  { file: "admin.py", code: "admin.site.register(Post)" },
];

test("renders the first file's highlighted code and its tabs", () => {
  render(<CodeBlock files={files} />);
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "admin.py" })).toBeInTheDocument();
  expect(document.querySelector(".hljs-keyword")).not.toBeNull();
});

test("switching tabs shows the other file's code", async () => {
  render(<CodeBlock files={files} />);
  await userEvent.click(screen.getByRole("tab", { name: "admin.py" }));
  expect(screen.getByText(/admin.site.register/)).toBeInTheDocument();
});

test("Copy writes the active file to the clipboard and shows feedback", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<CodeBlock files={files} />);
  await userEvent.click(screen.getByRole("button", { name: /copy/i }));
  expect(writeText).toHaveBeenCalledWith("class Post:\n    pass");
  expect(await screen.findByText(/copied/i)).toBeInTheDocument();
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- CodeBlock`
Expected: FAIL — cannot resolve `./CodeBlock`.

- [ ] **Step 8: Create `src/components/CodeBlock.tsx`**

```tsx
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { highlight, langForFile } from "@/lib/highlight";

export interface CodeFile {
  file: string;
  code: string;
}

export function CodeBlock({ files, className }: { files: CodeFile[]; className?: string }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = files[active] ?? { file: "", code: "" };

  // Reset selection if the file list shrinks (e.g. app switch).
  useEffect(() => {
    if (active > files.length - 1) setActive(0);
  }, [files.length, active]);

  async function copy() {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
    >
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-border bg-surface-2 px-2 py-1.5"
      >
        {files.map((f, i) => (
          <button
            key={f.file}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-md px-2.5 py-1 font-mono text-xs text-muted transition-colors",
              i === active && "bg-surface text-accent",
            )}
          >
            {f.file}
          </button>
        ))}
        <button
          onClick={copy}
          className="ml-auto rounded-md px-2.5 py-1 text-xs font-semibold text-accent hover:bg-surface"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto p-4 text-[13px] leading-relaxed">
        <code
          className={cn("hljs", `language-${langForFile(current.file)}`)}
          dangerouslySetInnerHTML={{ __html: highlight(current.code, langForFile(current.file)) }}
        />
      </pre>
    </div>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- CodeBlock`
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add packages/djangobuilder5/src/lib/highlight.ts packages/djangobuilder5/src/lib/highlight.test.ts \
        packages/djangobuilder5/src/components/CodeBlock.tsx packages/djangobuilder5/src/components/CodeBlock.test.tsx \
        packages/djangobuilder5/src/index.css
git commit -m "feat(db5): CodeBlock with token-driven highlighting, tabs, copy helper"
```

---

## Task 7: Zustand project store (local state + persistence)

**Files:**
- Create: `packages/djangobuilder5/src/store/projectStore.ts`
- Test: `packages/djangobuilder5/src/store/projectStore.test.ts`

- [ ] **Step 1: Write the failing test** `src/store/projectStore.test.ts`

```ts
import { beforeEach, expect, test } from "vitest";
import { useProjectStore } from "./projectStore";
import { makeSeedProject } from "@/domain/seed";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({ project: makeSeedProject(), selectedAppId: "app_blog", selectedModelId: "model_post" });
});

test("addModel appends a model to the app and selects it", () => {
  const { addModel } = useProjectStore.getState();
  addModel("app_blog", "Tag");
  const app = useProjectStore.getState().project.apps.find((a) => a.id === "app_blog")!;
  expect(app.models.map((m) => m.name)).toContain("Tag");
  expect(useProjectStore.getState().selectedModelId).toBe(
    app.models.find((m) => m.name === "Tag")!.id,
  );
});

test("addField then updateField mutates the target field", () => {
  const s = useProjectStore.getState();
  s.addField("app_blog", "model_post");
  const post = () => useProjectStore.getState().project.apps[0].models[0];
  const newField = post().fields.at(-1)!;
  s.updateField("app_blog", "model_post", newField.id, { name: "slug", type: "SlugField" });
  const updated = post().fields.find((f) => f.id === newField.id)!;
  expect(updated.name).toBe("slug");
  expect(updated.type).toBe("SlugField");
});

test("removeField deletes the field", () => {
  useProjectStore.getState().removeField("app_blog", "model_post", "f_body");
  const post = useProjectStore.getState().project.apps[0].models[0];
  expect(post.fields.find((f) => f.id === "f_body")).toBeUndefined();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/djangobuilder5 && bun run test -- projectStore`
Expected: FAIL — cannot resolve `./projectStore`.

- [ ] **Step 3: Create `src/store/projectStore.ts`**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { LocalField, LocalProject, RelationshipTypeName } from "@/domain/types";
import { makeSeedProject } from "@/domain/seed";

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

interface ProjectState {
  project: LocalProject;
  selectedAppId: string | null;
  selectedModelId: string | null;

  select: (appId: string, modelId: string | null) => void;
  setProjectName: (name: string) => void;
  setDjangoVersion: (v: 3 | 4 | 5) => void;
  setFlag: (flag: "channels" | "htmx" | "postgres", value: boolean) => void;

  addApp: (name: string) => void;
  addModel: (appId: string, name: string) => void;
  removeModel: (appId: string, modelId: string) => void;

  addField: (appId: string, modelId: string) => void;
  updateField: (appId: string, modelId: string, fieldId: string, patch: Partial<LocalField>) => void;
  removeField: (appId: string, modelId: string, fieldId: string) => void;

  addRelationship: (appId: string, modelId: string) => void;
  updateRelationship: (
    appId: string,
    modelId: string,
    relId: string,
    patch: Partial<{ name: string; type: RelationshipTypeName; to: string; args: string }>,
  ) => void;
  removeRelationship: (appId: string, modelId: string, relId: string) => void;
}

function findModel(project: LocalProject, appId: string, modelId: string) {
  return project.apps.find((a) => a.id === appId)?.models.find((m) => m.id === modelId);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set) => ({
      project: makeSeedProject(),
      selectedAppId: "app_blog",
      selectedModelId: "model_post",

      select: (appId, modelId) =>
        set((s) => {
          s.selectedAppId = appId;
          s.selectedModelId = modelId;
        }),
      setProjectName: (name) => set((s) => void (s.project.name = name)),
      setDjangoVersion: (v) => set((s) => void (s.project.djangoVersion = v)),
      setFlag: (flag, value) => set((s) => void (s.project[flag] = value)),

      addApp: (name) =>
        set((s) => {
          s.project.apps.push({ id: uid("app"), name, models: [] });
        }),

      addModel: (appId, name) =>
        set((s) => {
          const app = s.project.apps.find((a) => a.id === appId);
          if (!app) return;
          const id = uid("model");
          app.models.push({ id, name, abstract: false, fields: [], relationships: [] });
          s.selectedAppId = appId;
          s.selectedModelId = id;
        }),

      removeModel: (appId, modelId) =>
        set((s) => {
          const app = s.project.apps.find((a) => a.id === appId);
          if (!app) return;
          app.models = app.models.filter((m) => m.id !== modelId);
          if (s.selectedModelId === modelId) s.selectedModelId = app.models[0]?.id ?? null;
        }),

      addField: (appId, modelId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          model?.fields.push({ id: uid("f"), name: "new_field", type: "CharField", args: "max_length=100" });
        }),

      updateField: (appId, modelId, fieldId, patch) =>
        set((s) => {
          const field = findModel(s.project, appId, modelId)?.fields.find((f) => f.id === fieldId);
          if (field) Object.assign(field, patch);
        }),

      removeField: (appId, modelId, fieldId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          if (model) model.fields = model.fields.filter((f) => f.id !== fieldId);
        }),

      addRelationship: (appId, modelId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          model?.relationships.push({
            id: uid("r"),
            name: "related",
            type: "ForeignKey",
            to: "auth.User",
            args: "on_delete=models.CASCADE",
          });
        }),

      updateRelationship: (appId, modelId, relId, patch) =>
        set((s) => {
          const rel = findModel(s.project, appId, modelId)?.relationships.find((r) => r.id === relId);
          if (rel) Object.assign(rel, patch);
        }),

      removeRelationship: (appId, modelId, relId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          if (model) model.relationships = model.relationships.filter((r) => r.id !== relId);
        }),
    })),
    { name: "db5-project" },
  ),
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/djangobuilder5 && bun run test -- projectStore`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/djangobuilder5/src/store
git commit -m "feat(db5): zustand project store with immer + localStorage persistence"
```

---

## Task 8: App shell — TopNav, router, main entry

**Files:**
- Create: `packages/djangobuilder5/src/components/TopNav.tsx`
- Create: `packages/djangobuilder5/src/app/App.tsx`
- Modify: `packages/djangobuilder5/src/main.tsx`
- Test: `packages/djangobuilder5/src/app/App.test.tsx`

- [ ] **Step 1: Create `src/components/TopNav.tsx`**

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <Link to="/" className="text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm text-muted">
        <Link to="/build" className="hover:text-text">Build</Link>
        <a href="https://docs.djangoproject.com" className="hover:text-text">Docs</a>
        <span className="font-semibold text-accent">Sign in</span>
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create `src/app/App.tsx`**

```tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Splash } from "@/features/splash/Splash";
import { BuilderPage } from "@/features/builder/BuilderPage";

export function App() {
  return (
    <BrowserRouter>
      <div className="flex h-full flex-col">
        <TopNav />
        <main className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/build" element={<BuilderPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

Note: `Splash` and `BuilderPage` are created in Tasks 9 and 12. To keep this task independently compilable/testable, first create temporary one-line stubs, then replace them:
- `src/features/splash/Splash.tsx`: `export function Splash() { return <div>splash</div>; }`
- `src/features/builder/BuilderPage.tsx`: `export function BuilderPage() { return <div>builder</div>; }`

- [ ] **Step 3: Create the two stubs** (exact paths above) so Task 8 compiles on its own.

- [ ] **Step 4: Replace `src/main.tsx`** with the real entry (initializes theme before render)

```tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { applyTheme, getInitialTheme } from "@/lib/theme";

applyTheme(getInitialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Write the test** `src/app/App.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders the brand and lands on the splash route", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: /djangobuilder/i })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/djangobuilder5 && bun run test -- App`
Expected: PASS. (With stubs in place, the splash route renders "splash".)

- [ ] **Step 7: Commit**

```bash
git add packages/djangobuilder5/src/components/TopNav.tsx packages/djangobuilder5/src/app \
        packages/djangobuilder5/src/main.tsx packages/djangobuilder5/src/features
git commit -m "feat(db5): app shell — TopNav, router, themed entry point"
```

---

## Task 9: Splash — hero + live code preview

**Files:**
- Modify (replace stub): `packages/djangobuilder5/src/features/splash/Splash.tsx`
- Test: `packages/djangobuilder5/src/features/splash/Splash.test.tsx`

- [ ] **Step 1: Replace `src/features/splash/Splash.tsx`**

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/CodeBlock";
import { makeSeedProject } from "@/domain/seed";
import { renderAppPreview } from "@/domain/generate";

const CHIPS = ["Django 5", "DRF", "HTMX", "Channels"];

export function Splash() {
  const files = renderAppPreview(makeSeedProject(), "app_blog");

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Design your models.
          <br />
          <span className="bg-gradient-to-r from-accent to-[#8bf0c2] bg-clip-text text-transparent">
            Ship the Django.
          </span>
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Model your apps visually and get production-ready Django code — models, admin,
          serializers, views, URLs — in seconds.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button asChild size="lg">
            <Link to="/build">Start building — free</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/build">Live demo</Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {c}
            </span>
          ))}
        </div>
      </div>
      <CodeBlock files={files} className="shadow-[0_20px_60px_rgba(0,0,0,0.35)]" />
    </section>
  );
}
```

Note: `Button` renders a `<button>` and does not support `asChild`. To wrap a router `Link`, either (a) drop `asChild` and use `onClick`-navigation, or (b) style the `Link` with `buttonVariants`. Use option (b) — it's the shadcn idiom and keeps semantics correct. Replace the two CTA buttons with:

```tsx
<Link to="/build" className={buttonVariants({ size: "lg" })}>Start building — free</Link>
<Link to="/build" className={buttonVariants({ variant: "ghost", size: "lg" })}>Live demo</Link>
```

and import `{ buttonVariants }` from `@/components/ui/Button` (drop the `Button` import if unused).

- [ ] **Step 2: Write the test** `src/features/splash/Splash.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { Splash } from "./Splash";

test("shows the hero headline, a CTA to /build, and a live code panel", () => {
  render(
    <MemoryRouter>
      <Splash />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: /ship the django/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /start building/i })).toHaveAttribute("href", "/build");
  // live preview renders real generated code
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  expect(document.body.textContent).toContain("class Post");
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd packages/djangobuilder5 && bun run test -- Splash`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/djangobuilder5/src/features/splash
git commit -m "feat(db5): splash — hero + live models.py preview with copy"
```

---

## Task 10: Builder — left tree pane (apps → models)

**Files:**
- Create: `packages/djangobuilder5/src/features/builder/TreePane.tsx`
- Test: `packages/djangobuilder5/src/features/builder/TreePane.test.tsx`

- [ ] **Step 1: Create `src/features/builder/TreePane.tsx`**

```tsx
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { useProjectStore } from "@/store/projectStore";

export function TreePane() {
  const project = useProjectStore((s) => s.project);
  const selectedModelId = useProjectStore((s) => s.selectedModelId);
  const select = useProjectStore((s) => s.select);
  const addModel = useProjectStore((s) => s.addModel);
  const addApp = useProjectStore((s) => s.addApp);
  const [newModel, setNewModel] = useState<Record<string, string>>({});

  return (
    <aside className="w-56 shrink-0 overflow-y-auto border-r border-border p-3">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {project.name} Project
      </p>
      {project.apps.map((app) => (
        <div key={app.id} className="mb-3">
          <div className="flex items-center gap-2 px-1 py-1 text-sm font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--code-type)]" />
            {app.name}
          </div>
          <ul>
            {app.models.map((model) => (
              <li key={model.id}>
                <button
                  onClick={() => select(app.id, model.id)}
                  className={cn(
                    "ml-3 flex w-[calc(100%-0.75rem)] items-center rounded-md px-2 py-1 text-left text-sm text-muted hover:text-text",
                    model.id === selectedModelId && "bg-accent/15 text-accent",
                  )}
                >
                  {model.name}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="ml-3 mt-1"
            onSubmit={(e) => {
              e.preventDefault();
              const name = (newModel[app.id] ?? "").trim();
              if (name) {
                addModel(app.id, name);
                setNewModel((s) => ({ ...s, [app.id]: "" }));
              }
            }}
          >
            <Input
              aria-label={`Add model to ${app.name}`}
              placeholder="+ add model"
              value={newModel[app.id] ?? ""}
              onChange={(e) => setNewModel((s) => ({ ...s, [app.id]: e.target.value }))}
            />
          </form>
        </div>
      ))}
      <button
        onClick={() => addApp(`app${project.apps.length + 1}`)}
        className="mt-2 w-full rounded-md border border-dashed border-accent/40 bg-accent/5 px-2 py-1.5 text-xs text-accent"
      >
        + add app
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Write the test** `src/features/builder/TreePane.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { TreePane } from "./TreePane";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
  });
});

test("lists seed models and can add a new one via the inline input", async () => {
  render(<TreePane />);
  expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
  const input = screen.getByRole("textbox", { name: /add model to blog/i });
  await userEvent.type(input, "Tag{enter}");
  expect(await screen.findByRole("button", { name: "Tag" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd packages/djangobuilder5 && bun run test -- TreePane`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/djangobuilder5/src/features/builder/TreePane.tsx packages/djangobuilder5/src/features/builder/TreePane.test.tsx
git commit -m "feat(db5): builder tree pane — apps/models nav + inline add"
```

---

## Task 11: Builder — center editor pane (fields + relationships)

**Files:**
- Create: `packages/djangobuilder5/src/features/builder/EditorPane.tsx`
- Test: `packages/djangobuilder5/src/features/builder/EditorPane.test.tsx`

- [ ] **Step 1: Create `src/features/builder/EditorPane.tsx`**

```tsx
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fieldTypeNames, relationshipTargets, relationshipTypeNames } from "@/domain/options";
import type { RelationshipTypeName } from "@/domain/types";
import { useProjectStore } from "@/store/projectStore";

export function EditorPane() {
  const project = useProjectStore((s) => s.project);
  const appId = useProjectStore((s) => s.selectedAppId);
  const modelId = useProjectStore((s) => s.selectedModelId);
  const store = useProjectStore();

  const app = project.apps.find((a) => a.id === appId);
  const model = app?.models.find((m) => m.id === modelId);
  const targets = relationshipTargets(project.apps);

  if (!app || !model) {
    return <div className="flex-1 p-8 text-muted">Select a model to edit.</div>;
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="font-mono text-lg font-bold text-accent">{model.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted">model</span>
      </div>

      {/* Fields */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Fields</p>
        <Button size="sm" variant="subtle" onClick={() => store.addField(app.id, model.id)}>
          + field
        </Button>
      </div>
      <div className="space-y-2">
        {model.fields.map((field) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              aria-label={`field ${field.id} name`}
              className="w-40 font-mono"
              value={field.name}
              onChange={(e) => store.updateField(app.id, model.id, field.id, { name: e.target.value })}
            />
            <Select
              aria-label={`field ${field.id} type`}
              value={field.type}
              onChange={(e) => store.updateField(app.id, model.id, field.id, { type: e.target.value })}
            >
              {fieldTypeNames.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Input
              aria-label={`field ${field.id} args`}
              className="flex-1 font-mono"
              placeholder="args (e.g. max_length=200)"
              value={field.args}
              onChange={(e) => store.updateField(app.id, model.id, field.id, { args: e.target.value })}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`remove field ${field.id}`}
              onClick={() => store.removeField(app.id, model.id, field.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      {/* Relationships */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Relationships</p>
        <Button size="sm" variant="subtle" onClick={() => store.addRelationship(app.id, model.id)}>
          + relationship
        </Button>
      </div>
      <div className="space-y-2">
        {model.relationships.map((rel) => (
          <div key={rel.id} className="flex items-center gap-2">
            <Input
              aria-label={`rel ${rel.id} name`}
              className="w-40 font-mono"
              value={rel.name}
              onChange={(e) => store.updateRelationship(app.id, model.id, rel.id, { name: e.target.value })}
            />
            <Select
              aria-label={`rel ${rel.id} type`}
              value={rel.type}
              onChange={(e) =>
                store.updateRelationship(app.id, model.id, rel.id, {
                  type: e.target.value as RelationshipTypeName,
                })
              }
            >
              {relationshipTypeNames.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              aria-label={`rel ${rel.id} target`}
              value={rel.to}
              onChange={(e) => store.updateRelationship(app.id, model.id, rel.id, { to: e.target.value })}
            >
              {targets.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`remove rel ${rel.id}`}
              onClick={() => store.removeRelationship(app.id, model.id, rel.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the test** `src/features/builder/EditorPane.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { EditorPane } from "./EditorPane";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
  });
});

test("renders the selected model's fields", () => {
  render(<EditorPane />);
  expect(screen.getByDisplayValue("title")).toBeInTheDocument();
  expect(screen.getByDisplayValue("max_length=200")).toBeInTheDocument();
});

test("adding a field grows the store's field list", async () => {
  render(<EditorPane />);
  const before = useProjectStore.getState().project.apps[0].models[0].fields.length;
  await userEvent.click(screen.getByRole("button", { name: "+ field" }));
  expect(useProjectStore.getState().project.apps[0].models[0].fields.length).toBe(before + 1);
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd packages/djangobuilder5 && bun run test -- EditorPane`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/djangobuilder5/src/features/builder/EditorPane.tsx packages/djangobuilder5/src/features/builder/EditorPane.test.tsx
git commit -m "feat(db5): builder editor pane — inline field & relationship editing"
```

---

## Task 12: Builder — right code pane + three-pane assembly

**Files:**
- Create: `packages/djangobuilder5/src/features/builder/CodePane.tsx`
- Modify (replace stub): `packages/djangobuilder5/src/features/builder/BuilderPage.tsx`
- Test: `packages/djangobuilder5/src/features/builder/BuilderPage.test.tsx`

- [ ] **Step 1: Create `src/features/builder/CodePane.tsx`**

```tsx
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/CodeBlock";
import { downloadProjectTar, renderAppPreview } from "@/domain/generate";
import { useProjectStore } from "@/store/projectStore";

export function CodePane() {
  const project = useProjectStore((s) => s.project);
  const appId = useProjectStore((s) => s.selectedAppId);
  const files = appId ? renderAppPreview(project, appId) : [];

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Generated
        </span>
        <Button size="sm" onClick={() => downloadProjectTar(project)}>
          Download .tar
        </Button>
      </div>
      <div className="min-h-0 flex-1 p-3">
        {files.length ? (
          <CodeBlock files={files} className="h-full" />
        ) : (
          <p className="text-sm text-muted">Select an app to preview generated code.</p>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Replace `src/features/builder/BuilderPage.tsx`** (three-pane IDE layout)

```tsx
import { TreePane } from "./TreePane";
import { EditorPane } from "./EditorPane";
import { CodePane } from "./CodePane";

export function BuilderPage() {
  return (
    <div className="flex h-full min-h-0">
      <TreePane />
      <EditorPane />
      <CodePane />
    </div>
  );
}
```

- [ ] **Step 3: Write the integration test** `src/features/builder/BuilderPage.test.tsx`

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { BuilderPage } from "./BuilderPage";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
  });
});

test("editing a field name updates the live generated models.py", async () => {
  render(<BuilderPage />);
  const models = screen.getByRole("tab", { name: "models.py" });
  expect(models).toBeInTheDocument();
  const pre = document.querySelector("pre")!;
  expect(pre.textContent).toContain("title");

  const nameInput = screen.getByDisplayValue("title");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "headline");

  expect(document.querySelector("pre")!.textContent).toContain("headline");
});

test("Download .tar button is present", () => {
  render(<BuilderPage />);
  expect(screen.getByRole("button", { name: /download .tar/i })).toBeInTheDocument();
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/djangobuilder5 && bun run test -- BuilderPage`
Expected: PASS — proves the live edit → regenerate loop works end to end through `@djangobuilder/core`.

- [ ] **Step 5: Manually verify the whole slice**

Run: `cd /home/mark/devel/django_builder && bun run dev5`, open `http://localhost:8081`:
- Splash renders with the hero + live `models.py` + working Copy.
- "Start building" → `/build` shows the three panes.
- Add a model / add a field / change a type → right pane code updates live.
- "Download .tar" downloads `Blog.tar`.
- Theme toggle flips dark/light and the code palette follows.

- [ ] **Step 6: Commit**

```bash
git add packages/djangobuilder5/src/features/builder/CodePane.tsx \
        packages/djangobuilder5/src/features/builder/BuilderPage.tsx \
        packages/djangobuilder5/src/features/builder/BuilderPage.test.tsx
git commit -m "feat(db5): builder code pane + three-pane IDE assembly with live regen"
```

---

## Task 13: Wire package into the workspace and final verification

**Files:**
- Modify: `package.json` (repo root)

- [ ] **Step 1: Add root scripts** — edit the root `package.json` `scripts` block. Add these entries and fold `lint_v5`/`test_v5` into the aggregates:

```jsonc
// add:
"dev5": "bun run --filter=djangobuilder5 dev",
"build_v5": "bun run --filter=djangobuilder5 build",
"lint_v5": "bun run --filter=djangobuilder5 lint",
"test_v5": "bun run --filter=djangobuilder5 test",
```

Then change:
- `"lint": "bun run lint_core && bun run lint_io && bun run lint_v4"` → append ` && bun run lint_v5`
- `"test": "bun run test_smoke && bun run test_core && bun run test_v4 && bun run test_io"` → append ` && bun run test_v5`

(Leave the deploy-oriented `build` script — io + v4 — unchanged; db5 is not deployed in M1.)

- [ ] **Step 2: Run the package lint**

Run: `cd /home/mark/devel/django_builder && bun run lint_v5`
Expected: PASS with no errors (warnings from `react-refresh/only-export-components` on files exporting both a component and helpers are acceptable; fix any errors).

- [ ] **Step 3: Run the package type-check + build**

Run: `bun run build_v5`
Expected: `tsc --noEmit` clean, `vite build` writes `dist/`.

- [ ] **Step 4: Run the full package test suite**

Run: `bun run test_v5`
Expected: all Vitest suites pass (Button, theme, ThemeToggle, buildCoreProject, generate, highlight, CodeBlock, projectStore, App, Splash, TreePane, EditorPane, BuilderPage).

- [ ] **Step 5: Run the aggregate repo lint + test to confirm nothing else broke**

Run: `bun run lint && bun run test`
Expected: existing `core` / `io` / `v4` steps still pass, plus the new `lint_v5` / `test_v5`.

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "chore(db5): wire dev5/build_v5/lint_v5/test_v5 into workspace scripts"
```

---

## Self-review (completed against the spec)

**Spec coverage:**
- New `packages/djangobuilder5` React+Vite+TS+Tailwind+shadcn-foundation → Tasks 0–2. ✅
- `@djangobuilder/core` reused unchanged (build/render/tar) → Tasks 4–5. ✅
- Local state + `localStorage`, no Firebase → Task 7. ✅
- Dark-first + light + persisted toggle → Tasks 1, 3. ✅
- Coding palette as first-class tokens, reused by CodeBlock → Tasks 1, 6. ✅
- Inter + JetBrains Mono self-hosted → Tasks 0, 1. ✅
- App shell (nav, theme toggle, router) → Task 8. ✅
- Splash hero + live code + copy → Task 9. ✅
- Three-pane IDE builder, inline editing, file tabs, live regen, `.tar` download → Tasks 10–12. ✅
- Copy helpers (per-file copy + feedback) shared primitive → Task 6, used in 9 & 12. ✅
- Layered isolation (only `src/domain/` imports core) → Tasks 4–5 (screens/store never import core). ✅
- Testing per house style (Vitest, behavior-level) → every task. ✅
- Canvas / Firebase / dashboard explicitly deferred → not in any task. ✅

**Deviations flagged:** highlight.js instead of Shiki (rationale in header); native `<select>` instead of Radix Select for M1; fixed file tabs instead of `asTree` explorer. All noted for review.

**Type/name consistency check:** `cn` (`@/lib/cn`), `highlight`/`langForFile` (`@/lib/highlight`), `applyTheme`/`toggleTheme`/`getInitialTheme`/`currentTheme` (`@/lib/theme`), `buildCoreProject`, `renderAppPreview`/`projectTarUrl`/`downloadProjectTar`/`APP_PREVIEW_FILES` (`@/domain/generate`), `fieldTypeNames`/`relationshipTypeNames`/`relationshipTargets` (`@/domain/options`), `useProjectStore` with actions `select/addApp/addModel/removeModel/addField/updateField/removeField/addRelationship/updateRelationship/removeRelationship/setProjectName/setDjangoVersion/setFlag`, `CodeBlock` (`files` prop), `makeSeedProject` — all referenced consistently across tasks.

**Known follow-ups (not M1):** Firebase auth + Firestore sync + dashboard (M2); canvas/ERD view mode reading the same store (M3); `asTree` full file explorer; `--base=/db5/` + Firebase hosting wiring for deploy (M3); optional Radix-backed Select/Dialog/Toast via `shadcn add`.
