# djangobuilder5 — Milestone 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authentication, project persistence on the shared Firestore backend, and a projects dashboard to `packages/djangobuilder5`, so a signed-in user sees their existing projects and the builder auto-saves — fully interoperable with the live app.

**Architecture:** Only `src/lib/firebase.ts` and `src/domain/firestore/*` touch Firebase (modular SDK). A pure `mapper` re-nests the 5 flat owner-stamped collections into db5's `LocalProject`. A rewritten `projectStore` holds the live flat data + selection, derives the current `LocalProject` and dashboard summaries, and every builder edit writes through to Firestore (Firestore's local `onSnapshot` makes this feel instant; text edits debounce). Auth is gated at the router.

**Tech Stack:** React 19, Vite 6, TS, Tailwind v4, Zustand+immer, **firebase ^11 (modular)**, Vitest + RTL. Reference: `packages/djangobuilder4/src/firebase.ts` + `stores/user.ts`.

**Deviation from spec (flag at review):** The spec proposed **Firebase-emulator** service tests. This plan tests the service layer with **mocked `firebase/firestore` and `firebase/auth`** (asserting correct doc paths, owner-stamping, parent-map writes, cascade batches, query filters) — self-contained, CI-safe, and runnable by every execution subagent. The **dev project (`django-builder-dev`) is the manual end-to-end gate** (Task 11). Same coverage intent, robust to execute.

**Data-compatibility contract (from the M2 spec — honor exactly):**
- 5 flat collections `projects/apps/models/fields/relationships`; every doc has `owner: <uid>`; parent→child links are `{childId:true}` maps on the parent; children have no back-pointer.
- Field sets: project `{owner,name,description,channels,htmx,django_version,apps:{}}`; app `{owner,name,models:{}}`; model `{owner,name,abstract,parents:[],fields:{},relationships:{}}`; field `{owner,name,type,args}`; relationship `{owner,name,to,type,args}`.
- `django_version` stored as `3.2|4.1|5.1` (map from db5's `3|4|5`).
- Every read filters `where("owner","==",uid)`. Cascade-delete a project's descendants using the correct **`relationships`** collection (db4 has a singular-name bug).
- New models get two default fields: `created` (`DateTimeField`, `auto_now_add=True, editable=False`) and `last_updated` (`DateTimeField`, `auto_now=True, editable=False`).

---

## File structure (M2)

```
packages/djangobuilder5/
  src/lib/firebase.ts                      T1  init app/auth/db (mockable)
  src/domain/
    types.ts                               T1  (drop `postgres`)
    buildCoreProject.ts, seed.ts           T1  (drop postgres refs)
    firestore/
      version.ts                           T1  3|4|5 <-> 3.2/4.1/5.1
      types.ts                             T2  flat doc shapes + FlatData
      mapper.ts                            T2  renestProject, projectSummary (pure)
      auth.ts                              T3  auth calls + onAuth + isVerified
      data.ts                              T4  subscribeAll (5 collections)
      writes.ts                            T5  CRUD + cascade (owner-stamped)
  src/store/
    authStore.ts                           T6  {user, authLoaded} + initAuth
    projectStore.ts                        T6  REWRITE: flat data + write-through
  src/features/
    builder/{BuilderPage,EditorPane}.tsx   T7  :id + subscription; debounced text
    splash/Splash.tsx                      T7  "try it" -> anon
    auth/{LoginView,SignUpView,ResetPasswordView,ActionView,UnverifiedView}.tsx  T8
    auth/AuthCard.tsx                       T8  shared form shell
    dashboard/{DashboardView,ProjectCard,NewProjectDialog}.tsx  T9
  src/app/App.tsx                          T10 auth gate + routes
  src/components/TopNav.tsx                T10 user email + sign out
  src/main.tsx                             T10 initAuth before render
```

---

## Task 1: Firebase init, drop `postgres`, version helpers

**Files:**
- Modify: `packages/djangobuilder5/package.json` (add `firebase`)
- Create: `packages/djangobuilder5/src/lib/firebase.ts`
- Modify: `packages/djangobuilder5/src/domain/types.ts` (remove `postgres`)
- Modify: `packages/djangobuilder5/src/domain/buildCoreProject.ts` (drop `project.postgres`)
- Modify: `packages/djangobuilder5/src/domain/seed.ts` (drop `postgres`)
- Modify: `packages/djangobuilder5/src/store/projectStore.ts` (drop `postgres` from `setFlag` union) — this store is fully rewritten in Task 6, but must stay compiling/green until then.
- Create: `packages/djangobuilder5/src/domain/firestore/version.ts`
- Test: `packages/djangobuilder5/src/domain/firestore/version.test.ts`

- [ ] **Step 1: Add the firebase dependency**

Edit `package.json` `dependencies`, add: `"firebase": "^11.1.0",`. Then run: `cd /home/mark/devel/django_builder && bun install` (expect: resolves, adds firebase).

- [ ] **Step 2: Create `src/lib/firebase.ts`**

```ts
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASEURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// db5 keeps users signed in across sessions (the live db4 uses session-only).
void setPersistence(auth, browserLocalPersistence);

/** Swallow snapshot permission errors that fire right after sign-out. */
export function snapshotErrorHandler(error: unknown): void {
  if (auth.currentUser) throw error;
}
```

- [ ] **Step 3: Remove `postgres` from `LocalProject`** in `src/domain/types.ts` — delete the line `postgres: boolean;` from the `LocalProject` interface.

- [ ] **Step 4: Fix the `postgres` consumers**

In `src/domain/buildCoreProject.ts`, change the options object passed to `new DjangoProject(...)` from `{ htmx: project.htmx, channels: project.channels, postgres: project.postgres }` to `{ htmx: project.htmx, channels: project.channels }` (core defaults postgres).

In `src/domain/seed.ts`, delete the `postgres: false,` line from the returned object.

In `src/store/projectStore.ts`, change the `setFlag` signature type `"channels" | "htmx" | "postgres"` to `"channels" | "htmx"` (two places: the interface and the implementation param are the same generic — just the union literal).

- [ ] **Step 5: Write the failing test** `src/domain/firestore/version.test.ts`

```ts
import { expect, test } from "vitest";
import { toVersionNumber, fromVersion } from "./version";

test("toVersionNumber maps 3|4|5 to the Django enum numbers", () => {
  expect(toVersionNumber(3)).toBe(3.2);
  expect(toVersionNumber(4)).toBe(4.1);
  expect(toVersionNumber(5)).toBe(5.1);
});

test("fromVersion tolerates number or string and returns 3|4|5", () => {
  expect(fromVersion(3.2)).toBe(3);
  expect(fromVersion("4.1")).toBe(4);
  expect(fromVersion(5.1)).toBe(5);
  expect(fromVersion("5")).toBe(5);
  expect(fromVersion(undefined as unknown as number)).toBe(5); // default
});
```

- [ ] **Step 6: Run it, verify FAIL** — `cd packages/djangobuilder5 && bun run test -- version` (cannot resolve `./version`).

- [ ] **Step 7: Create `src/domain/firestore/version.ts`**

```ts
export type DjangoVersionNumber = 3 | 4 | 5;

/** db5 local (3|4|5) -> Firestore django_version (3.2|4.1|5.1). */
export function toVersionNumber(v: DjangoVersionNumber): number {
  return v === 3 ? 3.2 : v === 4 ? 4.1 : 5.1;
}

/** Firestore django_version (number or string) -> db5 local (3|4|5), default 5. */
export function fromVersion(v: number | string): DjangoVersionNumber {
  const s = String(v);
  if (s.startsWith("3")) return 3;
  if (s.startsWith("4")) return 4;
  return 5;
}
```

- [ ] **Step 8: Run tests + typecheck + M1 suite**

Run: `cd packages/djangobuilder5 && bun run test -- version` (PASS 2), then `bun run test` (all M1 tests still green after the postgres removal), then `bun run type-check` (clean), then `bun run build` (clean).

- [ ] **Step 9: Commit**

```bash
git add packages/djangobuilder5/package.json bun.lock packages/djangobuilder5/src/lib/firebase.ts \
        packages/djangobuilder5/src/domain/types.ts packages/djangobuilder5/src/domain/buildCoreProject.ts \
        packages/djangobuilder5/src/domain/seed.ts packages/djangobuilder5/src/store/projectStore.ts \
        packages/djangobuilder5/src/domain/firestore/version.ts packages/djangobuilder5/src/domain/firestore/version.test.ts
git commit -m "feat(db5): firebase init, drop postgres, django version mapping"
```

---

## Task 2: Firestore doc types + the mapper (pure)

**Files:**
- Create: `packages/djangobuilder5/src/domain/firestore/types.ts`
- Create: `packages/djangobuilder5/src/domain/firestore/mapper.ts`
- Test: `packages/djangobuilder5/src/domain/firestore/mapper.test.ts`

- [ ] **Step 1: Create `src/domain/firestore/types.ts`**

```ts
export interface ProjectDoc {
  id: string;
  owner: string;
  name: string;
  description: string;
  channels: boolean;
  htmx: boolean;
  django_version: number | string;
  apps: Record<string, boolean>;
}
export interface AppDoc {
  id: string;
  owner: string;
  name: string;
  models: Record<string, boolean>;
}
export interface DjangoParent { type: "django"; class: string }
export interface UserParent { type: "user"; app: string; model: string }
export type ParentDoc = DjangoParent | UserParent;
export interface ModelDoc {
  id: string;
  owner: string;
  name: string;
  abstract: boolean;
  parents?: ParentDoc[];
  fields: Record<string, boolean>;
  relationships: Record<string, boolean>;
}
export interface FieldDoc { id: string; owner: string; name: string; type: string; args: string }
export interface RelationshipDoc { id: string; owner: string; name: string; type: string; to: string; args: string }

/** All five collections as id-keyed maps (what a subscription accumulates). */
export interface FlatData {
  projects: Record<string, ProjectDoc>;
  apps: Record<string, AppDoc>;
  models: Record<string, ModelDoc>;
  fields: Record<string, FieldDoc>;
  relationships: Record<string, RelationshipDoc>;
}

export function emptyFlatData(): FlatData {
  return { projects: {}, apps: {}, models: {}, fields: {}, relationships: {} };
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  djangoVersion: 3 | 4 | 5;
  channels: boolean;
  htmx: boolean;
  appCount: number;
  modelCount: number;
}
```

- [ ] **Step 2: Write the failing test** `src/domain/firestore/mapper.test.ts`

```ts
import { expect, test } from "vitest";
import type { FlatData } from "./types";
import { renestProject, projectSummary } from "./mapper";

function fixture(): FlatData {
  return {
    projects: {
      p1: { id: "p1", owner: "u", name: "Blog", description: "d", channels: false, htmx: true, django_version: 5.1, apps: { a1: true } },
    },
    apps: { a1: { id: "a1", owner: "u", name: "blog", models: { m1: true, m2: true } } },
    models: {
      m1: { id: "m1", owner: "u", name: "Post", abstract: false, fields: { f1: true }, relationships: { r1: true } },
      m2: { id: "m2", owner: "u", name: "Comment", abstract: false, fields: {}, relationships: {} },
    },
    fields: { f1: { id: "f1", owner: "u", name: "title", type: "CharField", args: "max_length=200" } },
    relationships: { r1: { id: "r1", owner: "u", name: "author", type: "ForeignKey", to: "auth.User", args: "" } },
  };
}

test("renestProject builds a LocalProject from the flat maps", () => {
  const p = renestProject(fixture(), "p1")!;
  expect(p.id).toBe("p1");
  expect(p.name).toBe("Blog");
  expect(p.djangoVersion).toBe(5); // 5.1 -> 5
  expect(p.htmx).toBe(true);
  expect(p.apps.map((a) => a.name)).toEqual(["blog"]);
  const models = p.apps[0].models;
  expect(models.map((m) => m.name)).toEqual(["Post", "Comment"]);
  expect(models[0].fields).toEqual([{ id: "f1", name: "title", type: "CharField", args: "max_length=200" }]);
  expect(models[0].relationships[0]).toMatchObject({ name: "author", type: "ForeignKey", to: "auth.User" });
});

test("renestProject returns null for an unknown project id", () => {
  expect(renestProject(fixture(), "nope")).toBeNull();
});

test("renestProject skips dangling child ids without throwing", () => {
  const data = fixture();
  data.apps.a1.models.ghost = true; // pointer to a missing model
  const p = renestProject(data, "p1")!;
  expect(p.apps[0].models.map((m) => m.name)).toEqual(["Post", "Comment"]);
});

test("projectSummary reports counts and version", () => {
  const s = projectSummary(fixture(), "p1")!;
  expect(s).toMatchObject({ id: "p1", name: "Blog", djangoVersion: 5, appCount: 1, modelCount: 2, htmx: true });
});
```

- [ ] **Step 3: Run it, verify FAIL** — `bun run test -- mapper`.

- [ ] **Step 4: Create `src/domain/firestore/mapper.ts`**

```ts
import type { LocalApp, LocalModel, LocalProject, RelationshipTypeName } from "@/domain/types";
import { fromVersion } from "./version";
import type { FlatData, ProjectSummary } from "./types";

/** Re-nest the flat collections into one LocalProject (or null if absent). */
export function renestProject(data: FlatData, projectId: string): LocalProject | null {
  const project = data.projects[projectId];
  if (!project) return null;

  const apps: LocalApp[] = Object.keys(project.apps)
    .map((appId) => data.apps[appId])
    .filter(Boolean)
    .map((app) => {
      const models: LocalModel[] = Object.keys(app.models)
        .map((modelId) => data.models[modelId])
        .filter(Boolean)
        .map((model) => ({
          id: model.id,
          name: model.name,
          abstract: Boolean(model.abstract),
          fields: Object.keys(model.fields)
            .map((fieldId) => data.fields[fieldId])
            .filter(Boolean)
            .map((f) => ({ id: f.id, name: f.name, type: f.type, args: f.args ?? "" })),
          relationships: Object.keys(model.relationships)
            .map((relId) => data.relationships[relId])
            .filter(Boolean)
            .map((r) => ({
              id: r.id,
              name: r.name,
              type: r.type as RelationshipTypeName,
              to: r.to,
              args: r.args ?? "",
            })),
        }));
      return { id: app.id, name: app.name, models };
    });

  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    djangoVersion: fromVersion(project.django_version),
    channels: Boolean(project.channels),
    htmx: Boolean(project.htmx),
    apps,
  };
}

/** Lightweight summary for the dashboard (no field/relationship walk). */
export function projectSummary(data: FlatData, projectId: string): ProjectSummary | null {
  const project = data.projects[projectId];
  if (!project) return null;
  const appIds = Object.keys(project.apps).filter((id) => data.apps[id]);
  const modelCount = appIds.reduce(
    (n, id) => n + Object.keys(data.apps[id].models).filter((mid) => data.models[mid]).length,
    0,
  );
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    djangoVersion: fromVersion(project.django_version),
    channels: Boolean(project.channels),
    htmx: Boolean(project.htmx),
    appCount: appIds.length,
    modelCount,
  };
}
```

- [ ] **Step 5: Run tests, verify PASS (4)** — `bun run test -- mapper`.

- [ ] **Step 6: Commit**

```bash
git add packages/djangobuilder5/src/domain/firestore/types.ts \
        packages/djangobuilder5/src/domain/firestore/mapper.ts \
        packages/djangobuilder5/src/domain/firestore/mapper.test.ts
git commit -m "feat(db5): firestore doc types + pure renest/summary mapper"
```

---

## Task 3: Auth service

**Files:**
- Create: `packages/djangobuilder5/src/domain/firestore/auth.ts`
- Test: `packages/djangobuilder5/src/domain/firestore/auth.test.ts`

- [ ] **Step 1: Create `src/domain/firestore/auth.ts`**

```ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signOut,
  applyActionCode,
  confirmPasswordReset,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function onAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export function isVerified(user: User): boolean {
  const github = user.providerData.some((p) => p.providerId === "github.com");
  return github || user.emailVerified || user.isAnonymous;
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

const verifyActionSettings = () => ({ url: `${window.location.origin}/login` });

export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user, verifyActionSettings());
  return cred.user;
}

export async function signInAnon(): Promise<User> {
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function sendReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export function resendVerification(): Promise<void> {
  if (!auth.currentUser) return Promise.reject(new Error("Not signed in"));
  return sendEmailVerification(auth.currentUser, verifyActionSettings());
}

export function applyVerify(oobCode: string): Promise<void> {
  return applyActionCode(auth, oobCode);
}

export function confirmReset(oobCode: string, newPassword: string): Promise<void> {
  return confirmPasswordReset(auth, oobCode, newPassword);
}
```

- [ ] **Step 2: Write the test** `src/domain/firestore/auth.test.ts` (mocks `firebase/auth` and `@/lib/firebase`)

```ts
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
const fns = {
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  applyActionCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
  onAuthStateChanged: vi.fn(),
};
vi.mock("firebase/auth", () => fns);

import * as authSvc from "./auth";
import { auth } from "@/lib/firebase";

beforeEach(() => Object.values(fns).forEach((f) => f.mockReset()));

test("signUp creates the user and sends a verification email", async () => {
  fns.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "u1" } });
  fns.sendEmailVerification.mockResolvedValue(undefined);
  const user = await authSvc.signUp("a@b.com", "pw123456");
  expect(fns.createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "a@b.com", "pw123456");
  expect(fns.sendEmailVerification).toHaveBeenCalledOnce();
  expect(user).toEqual({ uid: "u1" });
});

test("isVerified is true for verified email, anonymous, or github", () => {
  expect(authSvc.isVerified({ providerData: [], emailVerified: true, isAnonymous: false } as never)).toBe(true);
  expect(authSvc.isVerified({ providerData: [], emailVerified: false, isAnonymous: true } as never)).toBe(true);
  expect(authSvc.isVerified({ providerData: [{ providerId: "github.com" }], emailVerified: false, isAnonymous: false } as never)).toBe(true);
  expect(authSvc.isVerified({ providerData: [], emailVerified: false, isAnonymous: false } as never)).toBe(false);
});

test("applyVerify / confirmReset forward the oobCode", async () => {
  fns.applyActionCode.mockResolvedValue(undefined);
  fns.confirmPasswordReset.mockResolvedValue(undefined);
  await authSvc.applyVerify("code1");
  await authSvc.confirmReset("code2", "newpw12345");
  expect(fns.applyActionCode).toHaveBeenCalledWith(auth, "code1");
  expect(fns.confirmPasswordReset).toHaveBeenCalledWith(auth, "code2", "newpw12345");
});
```

- [ ] **Step 3: Run, verify PASS (3)** — `bun run test -- auth`. Then `bun run type-check`.

- [ ] **Step 4: Commit**

```bash
git add packages/djangobuilder5/src/domain/firestore/auth.ts packages/djangobuilder5/src/domain/firestore/auth.test.ts
git commit -m "feat(db5): auth service (email/anon/reset/verify + onAuth + isVerified)"
```

---

## Task 4: Data subscription service

**Files:**
- Create: `packages/djangobuilder5/src/domain/firestore/data.ts`
- Test: `packages/djangobuilder5/src/domain/firestore/data.test.ts`

- [ ] **Step 1: Create `src/domain/firestore/data.ts`**

```ts
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, snapshotErrorHandler } from "@/lib/firebase";
import { emptyFlatData, type FlatData } from "./types";

const COLLECTIONS: Array<keyof FlatData> = ["projects", "apps", "models", "fields", "relationships"];

/**
 * Subscribe to all five owner-scoped collections. Rebuilds a FlatData snapshot on
 * every change and invokes `onData` with a fresh copy. Returns an unsubscribe fn.
 */
export function subscribeAll(user: User, onData: (data: FlatData) => void): () => void {
  const data = emptyFlatData();

  const unsubs = COLLECTIONS.map((name) => {
    const extra: QueryConstraint[] = name === "projects" ? [orderBy("name")] : [];
    const q = query(collection(db, name), where("owner", "==", user.uid), ...extra);
    return onSnapshot(
      q,
      (snap) => {
        snap.docChanges().forEach((change) => {
          const id = change.doc.id;
          const bucket = data[name] as Record<string, unknown>;
          if (change.type === "removed") delete bucket[id];
          else bucket[id] = { ...change.doc.data(), id };
        });
        onData(structuredClone(data));
      },
      (err) => snapshotErrorHandler(err),
    );
  });

  return () => unsubs.forEach((u) => u());
}
```

- [ ] **Step 2: Write the test** `src/domain/firestore/data.test.ts` (mock `firebase/firestore` + `@/lib/firebase`)

```ts
import { beforeEach, expect, test, vi } from "vitest";

const snapCbs: Record<string, (snap: unknown) => void> = {};
const fns = {
  collection: vi.fn((_db, name: string) => ({ name })),
  query: vi.fn((c) => c),
  where: vi.fn(() => ["where"]),
  orderBy: vi.fn(() => ["order"]),
  onSnapshot: vi.fn((q: { name: string }, cb: (s: unknown) => void) => {
    snapCbs[q.name] = cb;
    return () => delete snapCbs[q.name];
  }),
};
vi.mock("firebase/firestore", () => fns);
vi.mock("@/lib/firebase", () => ({ db: {}, snapshotErrorHandler: vi.fn() }));

import { subscribeAll } from "./data";

beforeEach(() => Object.values(fns).forEach((f) => f.mockClear?.()));

function change(type: string, id: string, data: object) {
  return { docChanges: () => [{ type, doc: { id, data: () => data } }] };
}

test("subscribes to all five owner-scoped collections", () => {
  subscribeAll({ uid: "u1" } as never, () => {});
  expect(fns.where).toHaveBeenCalledWith("owner", "==", "u1");
  expect(Object.keys(snapCbs).sort()).toEqual(["apps", "fields", "models", "projects", "relationships"]);
});

test("accumulates added docs and drops removed ones, stamping id", () => {
  const seen: unknown[] = [];
  subscribeAll({ uid: "u1" } as never, (d) => seen.push(d));
  snapCbs.projects(change("added", "p1", { name: "Blog", owner: "u1" }));
  let latest = seen.at(-1) as { projects: Record<string, unknown> };
  expect(latest.projects.p1).toMatchObject({ id: "p1", name: "Blog" });
  snapCbs.projects(change("removed", "p1", {}));
  latest = seen.at(-1) as { projects: Record<string, unknown> };
  expect(latest.projects.p1).toBeUndefined();
});
```

- [ ] **Step 3: Run, verify PASS (2)** — `bun run test -- data`. (Note: if `structuredClone` is unavailable in the jsdom env, it is available in Node 18+/jsdom 25 used here.)

- [ ] **Step 4: Commit**

```bash
git add packages/djangobuilder5/src/domain/firestore/data.ts packages/djangobuilder5/src/domain/firestore/data.test.ts
git commit -m "feat(db5): firestore subscription service (5 owner-scoped collections)"
```

---

## Task 5: Write service (CRUD + cascade)

**Files:**
- Create: `packages/djangobuilder5/src/domain/firestore/writes.ts`
- Test: `packages/djangobuilder5/src/domain/firestore/writes.test.ts`

- [ ] **Step 1: Create `src/domain/firestore/writes.ts`** (adapted from db4 `firebase.ts`, owner-stamped, `apps:{}`/`relationships:{}`, default fields, correct `relationships` cascade)

```ts
import {
  addDoc,
  collection,
  deleteField,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { toVersionNumber } from "./version";
import type { DjangoVersionNumber } from "./version";
import type { LocalApp } from "@/domain/types";

type Args = Record<string, string | boolean | number>;

export async function createProject(
  user: User,
  name: string,
  description: string,
  djangoVersion: DjangoVersionNumber,
  htmx: boolean,
  channels: boolean,
): Promise<string> {
  const ref = await addDoc(collection(db, "projects"), {
    owner: user.uid,
    name,
    description,
    django_version: toVersionNumber(djangoVersion),
    htmx,
    channels,
    apps: {},
  });
  return ref.id;
}

export async function addApp(user: User, projectId: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, "apps"), { owner: user.uid, name, models: {} });
  await updateDoc(doc(db, "projects", projectId), { [`apps.${ref.id}`]: true });
  return ref.id;
}

/** Create a model plus the two default DateTimeField fields (created/last_updated). */
export async function addModel(user: User, appId: string, name: string): Promise<string> {
  const modelRef = await addDoc(collection(db, "models"), {
    owner: user.uid,
    name,
    abstract: false,
    parents: [],
    fields: {},
    relationships: {},
  });
  await updateDoc(doc(db, "apps", appId), { [`models.${modelRef.id}`]: true });
  await addField(user, modelRef.id, "created", "DateTimeField", "auto_now_add=True, editable=False");
  await addField(user, modelRef.id, "last_updated", "DateTimeField", "auto_now=True, editable=False");
  return modelRef.id;
}

export async function addField(
  user: User,
  modelId: string,
  name: string,
  type: string,
  args: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "fields"), { owner: user.uid, name, type, args });
  await updateDoc(doc(db, "models", modelId), { [`fields.${ref.id}`]: true });
  return ref.id;
}

export async function addRelationship(
  user: User,
  modelId: string,
  name: string,
  type: string,
  to: string,
  args: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "relationships"), { owner: user.uid, name, type, to, args });
  await updateDoc(doc(db, "models", modelId), { [`relationships.${ref.id}`]: true });
  return ref.id;
}

export const updateProject = (id: string, args: Args) => updateDoc(doc(db, "projects", id), args);
export const updateModel = (id: string, args: Args) => updateDoc(doc(db, "models", id), args);
export const updateField = (id: string, args: Args) => updateDoc(doc(db, "fields", id), args);
export const updateRelationship = (id: string, args: Args) => updateDoc(doc(db, "relationships", id), args);

export async function removeField(modelId: string, fieldId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "fields", fieldId));
  batch.update(doc(db, "models", modelId), { [`fields.${fieldId}`]: deleteField() });
  await batch.commit();
}

export async function removeRelationship(modelId: string, relId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "relationships", relId));
  batch.update(doc(db, "models", modelId), { [`relationships.${relId}`]: deleteField() });
  await batch.commit();
}

export async function removeModel(appId: string, model: { id: string; fields: { id: string }[]; relationships: { id: string }[] }): Promise<void> {
  const batch = writeBatch(db);
  model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
  model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
  batch.delete(doc(db, "models", model.id));
  batch.update(doc(db, "apps", appId), { [`models.${model.id}`]: deleteField() });
  await batch.commit();
}

/** Cascade-delete a project and every descendant (uses the correct `relationships`). */
export async function deleteProjectCascade(project: {
  id: string;
  apps: Array<LocalApp>;
}): Promise<void> {
  const batch = writeBatch(db);
  for (const app of project.apps) {
    for (const model of app.models) {
      model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
      model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
      batch.delete(doc(db, "models", model.id));
    }
    batch.delete(doc(db, "apps", app.id));
  }
  batch.delete(doc(db, "projects", project.id));
  await batch.commit();
}
```

- [ ] **Step 2: Write the test** `src/domain/firestore/writes.test.ts` (mock `firebase/firestore`)

```ts
import { beforeEach, expect, test, vi } from "vitest";

const batch = { delete: vi.fn(), update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
const fns = {
  addDoc: vi.fn().mockResolvedValue({ id: "new1" }),
  collection: vi.fn((_db, name: string) => ({ name })),
  doc: vi.fn((_db, coll: string, id: string) => ({ coll, id })),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteField: vi.fn(() => "DELETE"),
  writeBatch: vi.fn(() => batch),
};
vi.mock("firebase/firestore", () => fns);
vi.mock("@/lib/firebase", () => ({ db: {} }));

import * as w from "./writes";
const U = { uid: "u1" } as never;

beforeEach(() => {
  [batch.delete, batch.update, batch.commit].forEach((f) => f.mockClear());
  Object.values(fns).forEach((f) => f.mockClear?.());
  fns.addDoc.mockResolvedValue({ id: "new1" });
});

test("createProject stamps owner + maps version to 5.1 + apps:{}", async () => {
  await w.createProject(U, "Blog", "d", 5, true, false);
  expect(fns.addDoc).toHaveBeenCalledWith({ name: "projects" }, {
    owner: "u1", name: "Blog", description: "d", django_version: 5.1, htmx: true, channels: false, apps: {},
  });
});

test("addApp creates app then sets the parent project map key", async () => {
  await w.addApp(U, "p1", "blog");
  expect(fns.addDoc).toHaveBeenCalledWith({ name: "apps" }, { owner: "u1", name: "blog", models: {} });
  expect(fns.updateDoc).toHaveBeenCalledWith({ coll: "projects", id: "p1" }, { "apps.new1": true });
});

test("addModel writes the model, links the app, and adds two default fields", async () => {
  await w.addModel(U, "a1", "Post");
  // model doc + app link
  expect(fns.updateDoc).toHaveBeenCalledWith({ coll: "apps", id: "a1" }, { "models.new1": true });
  // two default fields created (created + last_updated)
  const fieldCreates = fns.addDoc.mock.calls.filter((c) => c[0].name === "fields");
  expect(fieldCreates).toHaveLength(2);
  expect(fieldCreates[0][1]).toMatchObject({ name: "created", type: "DateTimeField" });
  expect(fieldCreates[1][1]).toMatchObject({ name: "last_updated", type: "DateTimeField" });
});

test("removeField deletes the field doc and clears the parent map key", async () => {
  await w.removeField("m1", "f1");
  expect(batch.delete).toHaveBeenCalledWith({ coll: "fields", id: "f1" });
  expect(batch.update).toHaveBeenCalledWith({ coll: "models", id: "m1" }, { "fields.f1": "DELETE" });
  expect(batch.commit).toHaveBeenCalledOnce();
});

test("deleteProjectCascade batches every descendant using the plural relationships collection", async () => {
  await w.deleteProjectCascade({
    id: "p1",
    apps: [{ id: "a1", name: "blog", models: [{ id: "m1", name: "Post", abstract: false,
      fields: [{ id: "f1", name: "t", type: "CharField", args: "" }],
      relationships: [{ id: "r1", name: "a", type: "ForeignKey", to: "auth.User", args: "" }] }] }],
  });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "relationships", id: "r1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "fields", id: "f1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "models", id: "m1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "apps", id: "a1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "projects", id: "p1" });
  expect(batch.commit).toHaveBeenCalledOnce();
});
```

- [ ] **Step 3: Run, verify PASS (5)** — `bun run test -- writes`. Then `bun run type-check`.

- [ ] **Step 4: Commit**

```bash
git add packages/djangobuilder5/src/domain/firestore/writes.ts packages/djangobuilder5/src/domain/firestore/writes.test.ts
git commit -m "feat(db5): firestore write service — owner-stamped CRUD + cascade"
```

---

## Task 6: authStore + projectStore rewrite (write-through)

**Files:**
- Create: `packages/djangobuilder5/src/store/authStore.ts`
- Test: `packages/djangobuilder5/src/store/authStore.test.ts`
- Rewrite: `packages/djangobuilder5/src/store/projectStore.ts`
- Rewrite: `packages/djangobuilder5/src/store/projectStore.test.ts`

- [ ] **Step 1: Create `src/store/authStore.ts`**

```ts
import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuth } from "@/domain/firestore/auth";

interface AuthState {
  user: User | null;
  authLoaded: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoaded: false,
  setUser: (user) => set({ user, authLoaded: true }),
}));

/** Wire Firebase auth state into the store. Call once at startup. */
export function initAuth(): () => void {
  return onAuth((user) => useAuthStore.getState().setUser(user));
}
```

- [ ] **Step 2: Test `src/store/authStore.test.ts`**

```ts
import { expect, test, vi } from "vitest";
let handler: ((u: unknown) => void) | null = null;
vi.mock("@/domain/firestore/auth", () => ({ onAuth: (cb: (u: unknown) => void) => { handler = cb; return () => {}; } }));
import { useAuthStore, initAuth } from "./authStore";

test("initAuth pipes firebase auth state into the store and flips authLoaded", () => {
  expect(useAuthStore.getState().authLoaded).toBe(false);
  initAuth();
  handler!({ uid: "u1" });
  expect(useAuthStore.getState().user).toEqual({ uid: "u1" });
  expect(useAuthStore.getState().authLoaded).toBe(true);
  handler!(null);
  expect(useAuthStore.getState().user).toBeNull();
});
```

- [ ] **Step 3: Run, verify PASS** — `bun run test -- authStore`.

- [ ] **Step 4: Rewrite `src/store/projectStore.ts`** — Firestore-backed, write-through. Replaces the M1 local-seed store entirely.

```ts
import { create } from "zustand";
import type { User } from "firebase/auth";
import type { LocalProject, RelationshipTypeName } from "@/domain/types";
import { emptyFlatData, type FlatData, type ProjectSummary } from "@/domain/firestore/types";
import { renestProject, projectSummary } from "@/domain/firestore/mapper";
import { subscribeAll } from "@/domain/firestore/data";
import * as fs from "@/domain/firestore/writes";
import { toVersionNumber, type DjangoVersionNumber } from "@/domain/firestore/version";

interface ProjectState {
  user: User | null;
  data: FlatData;
  dataLoaded: boolean;
  currentProjectId: string | null;
  selectedAppId: string | null;
  selectedModelId: string | null;

  // derived, recomputed on every snapshot / open:
  project: LocalProject | null;
  summaries: ProjectSummary[];

  // lifecycle
  start: (user: User) => void;
  stop: () => void;
  openProject: (projectId: string) => void;
  select: (appId: string, modelId: string | null) => void;

  // dashboard writes
  createProject: (name: string, description: string, v: DjangoVersionNumber, htmx: boolean, channels: boolean) => Promise<string | null>;
  deleteProject: (projectId: string) => Promise<void>;

  // builder write-through
  setProjectName: (name: string) => void;
  setDjangoVersion: (v: DjangoVersionNumber) => void;
  setFlag: (flag: "channels" | "htmx", value: boolean) => void;
  addApp: (name: string) => void;
  addModel: (appId: string, name: string) => void;
  removeModel: (appId: string, modelId: string) => void;
  addField: (appId: string, modelId: string) => void;
  updateField: (appId: string, modelId: string, fieldId: string, patch: Partial<{ name: string; type: string; args: string }>) => void;
  removeField: (appId: string, modelId: string, fieldId: string) => void;
  addRelationship: (appId: string, modelId: string) => void;
  updateRelationship: (appId: string, modelId: string, relId: string, patch: Partial<{ name: string; type: RelationshipTypeName; to: string; args: string }>) => void;
  removeRelationship: (appId: string, modelId: string, relId: string) => void;
}

let unsubscribe: (() => void) | null = null;

function recompute(state: ProjectState): Partial<ProjectState> {
  return {
    project: state.currentProjectId ? renestProject(state.data, state.currentProjectId) : null,
    summaries: Object.keys(state.data.projects)
      .map((id) => projectSummary(state.data, id))
      .filter((s): s is ProjectSummary => s !== null)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function findModel(project: LocalProject | null, appId: string, modelId: string) {
  return project?.apps.find((a) => a.id === appId)?.models.find((m) => m.id === modelId) ?? null;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  user: null,
  data: emptyFlatData(),
  dataLoaded: false,
  currentProjectId: null,
  selectedAppId: null,
  selectedModelId: null,
  project: null,
  summaries: [],

  start: (user) => {
    unsubscribe?.();
    set({ user, data: emptyFlatData(), dataLoaded: false });
    unsubscribe = subscribeAll(user, (data) => {
      set((s) => ({ data, dataLoaded: true, ...recompute({ ...s, data }) }));
    });
  },
  stop: () => {
    unsubscribe?.();
    unsubscribe = null;
    set({ user: null, data: emptyFlatData(), dataLoaded: false, currentProjectId: null, project: null, summaries: [] });
  },
  openProject: (projectId) =>
    set((s) => {
      const next = { ...s, currentProjectId: projectId };
      const project = renestProject(s.data, projectId);
      const app = project?.apps[0] ?? null;
      return { currentProjectId: projectId, ...recompute(next), selectedAppId: app?.id ?? null, selectedModelId: app?.models[0]?.id ?? null };
    }),
  select: (appId, modelId) => set({ selectedAppId: appId, selectedModelId: modelId }),

  createProject: async (name, description, v, htmx, channels) => {
    const user = get().user;
    if (!user) return null;
    return fs.createProject(user, name, description, v, htmx, channels);
  },
  deleteProject: async (projectId) => {
    const project = renestProject(get().data, projectId);
    if (project) await fs.deleteProjectCascade(project);
  },

  setProjectName: (name) => { const id = get().currentProjectId; if (id) void fs.updateProject(id, { name }); },
  setDjangoVersion: (v) => { const id = get().currentProjectId; if (id) void fs.updateProject(id, { django_version: toVersionNumber(v) }); },
  setFlag: (flag, value) => { const id = get().currentProjectId; if (id) void fs.updateProject(id, { [flag]: value }); },

  addApp: (name) => { const { user, currentProjectId } = get(); if (user && currentProjectId) void fs.addApp(user, currentProjectId, name); },
  addModel: (appId, name) => { const user = get().user; if (user) void fs.addModel(user, appId, name); },
  removeModel: (appId, modelId) => {
    const model = findModel(get().project, appId, modelId);
    if (model) void fs.removeModel(appId, model);
  },
  addField: (_appId, modelId) => { const user = get().user; if (user) void fs.addField(user, modelId, "new_field", "CharField", "max_length=100"); },
  updateField: (_appId, _modelId, fieldId, patch) => void fs.updateField(fieldId, patch),
  removeField: (_appId, modelId, fieldId) => void fs.removeField(modelId, fieldId),
  addRelationship: (_appId, modelId) => { const user = get().user; if (user) void fs.addRelationship(user, modelId, "related", "ForeignKey", "auth.User", "on_delete=models.CASCADE"); },
  updateRelationship: (_appId, _modelId, relId, patch) => void fs.updateRelationship(relId, patch),
  removeRelationship: (_appId, modelId, relId) => void fs.removeRelationship(modelId, relId),
}));
```

- [ ] **Step 5: Rewrite `src/store/projectStore.test.ts`** (mock the write service + drive snapshots)

```ts
import { beforeEach, expect, test, vi } from "vitest";

let snapshotCb: ((d: unknown) => void) | null = null;
vi.mock("@/domain/firestore/data", () => ({
  subscribeAll: (_u: unknown, cb: (d: unknown) => void) => { snapshotCb = cb; return () => {}; },
}));
const writes = {
  createProject: vi.fn().mockResolvedValue("p1"), deleteProjectCascade: vi.fn(),
  addApp: vi.fn(), addModel: vi.fn(), removeModel: vi.fn(),
  addField: vi.fn(), updateField: vi.fn(), removeField: vi.fn(),
  addRelationship: vi.fn(), updateRelationship: vi.fn(), removeRelationship: vi.fn(),
  updateProject: vi.fn(),
};
vi.mock("@/domain/firestore/writes", () => writes);
import { useProjectStore } from "./projectStore";

const FLAT = {
  projects: { p1: { id: "p1", owner: "u", name: "Blog", description: "", channels: false, htmx: true, django_version: 5.1, apps: { a1: true } } },
  apps: { a1: { id: "a1", owner: "u", name: "blog", models: { m1: true } } },
  models: { m1: { id: "m1", owner: "u", name: "Post", abstract: false, fields: { f1: true }, relationships: {} } },
  fields: { f1: { id: "f1", owner: "u", name: "title", type: "CharField", args: "max_length=200" } },
  relationships: {},
};

beforeEach(() => {
  Object.values(writes).forEach((f) => f.mockClear());
  useProjectStore.getState().stop();
  useProjectStore.getState().start({ uid: "u" } as never);
  snapshotCb!(FLAT);
});

test("a snapshot builds summaries and (after open) the current project", () => {
  expect(useProjectStore.getState().summaries.map((s) => s.name)).toEqual(["Blog"]);
  useProjectStore.getState().openProject("p1");
  expect(useProjectStore.getState().project?.apps[0].models[0].name).toBe("Post");
});

test("addField write-through calls the service for the current user + model", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().addField("a1", "m1");
  expect(writes.addField).toHaveBeenCalledWith({ uid: "u" }, "m1", "new_field", "CharField", "max_length=100");
});

test("updateField write-through forwards the patch by field id", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().updateField("a1", "m1", "f1", { name: "headline" });
  expect(writes.updateField).toHaveBeenCalledWith("f1", { name: "headline" });
});

test("createProject delegates to the service with the current user", async () => {
  await useProjectStore.getState().createProject("Shop", "d", 5, false, false);
  expect(writes.createProject).toHaveBeenCalledWith({ uid: "u" }, "Shop", "d", 5, false, false);
});
```

- [ ] **Step 6: Run, verify PASS** — `bun run test -- projectStore` and `bun run test -- authStore`. Then `bun run type-check`.

Note: the M1 builder component tests (TreePane/EditorPane/BuilderPage) that did `useProjectStore.setState({ project, selectedAppId, selectedModelId })` still compile because `project`/`selectedAppId`/`selectedModelId` remain top-level state — they are updated in Task 7. Do not fix those here; Task 7 owns them.

- [ ] **Step 7: Commit**

```bash
git add packages/djangobuilder5/src/store/authStore.ts packages/djangobuilder5/src/store/authStore.test.ts \
        packages/djangobuilder5/src/store/projectStore.ts packages/djangobuilder5/src/store/projectStore.test.ts
git commit -m "feat(db5): auth store + firestore-backed project store (write-through)"
```

---

## Task 7: Builder wiring — subscription, :id, debounced text, splash "try it"

**Files:**
- Rewrite: `packages/djangobuilder5/src/features/builder/BuilderPage.tsx`
- Modify: `packages/djangobuilder5/src/features/builder/EditorPane.tsx` (debounced text inputs)
- Modify: `packages/djangobuilder5/src/features/builder/BuilderPage.test.tsx`
- Modify: `packages/djangobuilder5/src/features/builder/TreePane.test.tsx` and `EditorPane.test.tsx` (seed via `openProject` on injected data — see step 5)
- Modify: `packages/djangobuilder5/src/features/splash/Splash.tsx` (CTA → anonymous sign-in)
- Test: `packages/djangobuilder5/src/features/splash/Splash.test.tsx` (update CTA assertion)

- [ ] **Step 1: Rewrite `BuilderPage.tsx`** to take the `:id` param and show a loading state until the project hydrates.

```tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { TreePane } from "./TreePane";
import { EditorPane } from "./EditorPane";
import { CodePane } from "./CodePane";
import { useProjectStore } from "@/store/projectStore";

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const dataLoaded = useProjectStore((s) => s.dataLoaded);
  const project = useProjectStore((s) => s.project);
  const openProject = useProjectStore((s) => s.openProject);

  useEffect(() => {
    if (id) openProject(id);
  }, [id, openProject, dataLoaded]);

  if (!dataLoaded) return <div className="p-8 text-muted">Loading…</div>;
  if (!project) return <div className="p-8 text-muted">Project not found.</div>;

  return (
    <div className="flex h-full min-h-0">
      <TreePane />
      <EditorPane />
      <CodePane />
    </div>
  );
}
```

- [ ] **Step 2: Debounce text inputs in `EditorPane.tsx`.** Replace the three text `Input`s (field name, field args, relationship name) — which currently bind directly to the store and call `updateField`/`updateRelationship` on every keystroke — with a small `DebouncedInput` that keeps local state and commits after 400ms. Add this component at the top of the file and use it for the name/args text inputs (keep the `Select`s writing immediately).

```tsx
import { useEffect, useRef, useState } from "react";
// ...existing imports (Button, Input, Select, options, types, useProjectStore)...

function DebouncedInput({
  value, onCommit, ...props
}: { value: string; onCommit: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // adopt external value when it changes and we're not mid-edit
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <Input
      {...props}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(v), 400);
      }}
      onBlur={() => { if (timer.current) clearTimeout(timer.current); onCommit(local); }}
    />
  );
}
```

Then, in the fields map, replace the name `Input` with:
```tsx
<DebouncedInput aria-label={`field ${field.id} name`} className="w-40 font-mono" value={field.name}
  onCommit={(v) => store.updateField(app.id, model.id, field.id, { name: v })} />
```
the args `Input` with:
```tsx
<DebouncedInput aria-label={`field ${field.id} args`} className="flex-1 font-mono" placeholder="args (e.g. max_length=200)" value={field.args}
  onCommit={(v) => store.updateField(app.id, model.id, field.id, { args: v })} />
```
and the relationship name `Input` similarly with `onCommit={(v) => store.updateRelationship(app.id, model.id, rel.id, { name: v })}`. The `Select`s stay as-is (immediate `updateField`/`updateRelationship`). The `store` value comes from `const store = useProjectStore();` — keep the existing `project`/`appId`/`modelId` selectors, but guard `if (!app || !model) return <div className="flex-1 p-8 text-muted">Select a model to edit.</div>;` already present.

- [ ] **Step 3: Splash CTA → anonymous sign-in.** In `Splash.tsx`, replace the two `<Link to="/build">` CTAs with buttons that sign in anonymously then navigate to `/projects`.

```tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { signInAnon } from "@/domain/firestore/auth";
// ...
export function Splash() {
  const navigate = useNavigate();
  const files = renderAppPreview(makeSeedProject(), "app_blog");
  async function tryIt() {
    await signInAnon();
    navigate("/projects");
  }
  // ...in the CTA row:
  // <Button size="lg" onClick={tryIt}>Start building — free</Button>
  // <Button variant="ghost" size="lg" onClick={tryIt}>Live demo</Button>
}
```
(Keep the rest of the hero + `CodeBlock` exactly as-is.)

- [ ] **Step 4: Update the splash test** `Splash.test.tsx` — the CTA is now a button, not a link. Replace the CTA assertion:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
vi.mock("@/domain/firestore/auth", () => ({ signInAnon: vi.fn().mockResolvedValue({ uid: "anon" }) }));
import { Splash } from "./Splash";

test("shows the hero headline, a start button, and a live code panel", () => {
  render(<MemoryRouter><Splash /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: /ship the django/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start building/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  expect(document.body.textContent).toContain("class Post");
});
```

- [ ] **Step 5: Update the three builder component tests to seed via the store's data + open.** The M1 tests seeded `useProjectStore.setState({ project: makeSeedProject(), selectedAppId, selectedModelId })`. The store still exposes `project`/`selectedAppId`/`selectedModelId` as state, so **the existing seeding still works** — but the write-through actions now call the mocked service instead of mutating `project`. Update the assertions that checked local mutation:

  - In `TreePane.test.tsx`: the test "can add a new one via the inline input" asserted the new model appears. With write-through, `addModel` calls the service (no local mutation, no snapshot in the unit test), so the model will NOT appear. Change the test to assert the store action was invoked. Add at top: `const addModel = vi.fn(); ` then `useProjectStore.setState({ project: makeSeedProject(), selectedAppId: "app_blog", selectedModelId: "model_post", addModel } as never);` and assert `expect(addModel).toHaveBeenCalledWith("app_blog", "Tag")` after typing `Tag{enter}`. Keep the "lists seed models" assertion (reads `project`).
  - In `EditorPane.test.tsx`: "adding a field grows the store's field list" → replace with a spy: seed `addField: vi.fn()` into the store and assert `expect(addField).toHaveBeenCalledWith("app_blog", "model_post")` after clicking "+ field". Keep "renders the selected model's fields" (reads `project`).
  - In `BuilderPage.test.tsx`: the integration test relied on local live-regen. Rewrite it to seed `project` + `dataLoaded:true` + a spy `updateField`, wrap in `MemoryRouter` (BuilderPage now uses `useParams`), render at a route `"/project/p1"`, and assert (a) the models.py tab renders and (b) editing the field name calls `updateField`. Because BuilderPage now reads `:id` and calls `openProject`, seed `currentProjectId` too. Concretely:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { BuilderPage } from "./BuilderPage";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

const updateField = vi.fn();
beforeEach(() => {
  updateField.mockClear();
  useProjectStore.setState({
    dataLoaded: true, currentProjectId: "p1", project: makeSeedProject(),
    selectedAppId: "app_blog", selectedModelId: "model_post",
    openProject: vi.fn(), updateField,
  } as never);
});

test("renders the generated code and routes edits to the store", async () => {
  render(<MemoryRouter initialEntries={["/project/p1"]}>
    <Routes><Route path="/project/:id" element={<BuilderPage />} /></Routes>
  </MemoryRouter>);
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  const nameInput = screen.getByDisplayValue("title");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "headline");
  nameInput.blur();
  expect(updateField).toHaveBeenCalled();
});

test("shows a loading state until data is loaded", () => {
  useProjectStore.setState({ dataLoaded: false } as never);
  render(<MemoryRouter initialEntries={["/project/p1"]}>
    <Routes><Route path="/project/:id" element={<BuilderPage />} /></Routes>
  </MemoryRouter>);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the builder + splash suites, verify PASS** — `bun run test -- builder`, `bun run test -- Splash`, then `bun run test` (whole suite green), `bun run type-check`.

- [ ] **Step 7: Commit**

```bash
git add packages/djangobuilder5/src/features/builder packages/djangobuilder5/src/features/splash
git commit -m "feat(db5): firestore-backed builder (route :id, debounced edits) + anon try-it"
```

---

## Task 8: Auth screens

**Files:**
- Create: `packages/djangobuilder5/src/features/auth/AuthCard.tsx`
- Create: `packages/djangobuilder5/src/features/auth/LoginView.tsx`
- Create: `packages/djangobuilder5/src/features/auth/SignUpView.tsx`
- Create: `packages/djangobuilder5/src/features/auth/ResetPasswordView.tsx`
- Create: `packages/djangobuilder5/src/features/auth/ActionView.tsx`
- Create: `packages/djangobuilder5/src/features/auth/UnverifiedView.tsx`
- Test: `packages/djangobuilder5/src/features/auth/LoginView.test.tsx`
- Test: `packages/djangobuilder5/src/features/auth/ActionView.test.tsx`

- [ ] **Step 1: Create `AuthCard.tsx`** (shared centered form shell)

```tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <Link to="/" className="mb-6 text-center text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-4 text-lg font-bold">{title}</h1>
        {children}
      </div>
      {footer ? <div className="mt-4 text-center text-sm text-muted">{footer}</div> : null}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{message}</p>;
}
```

- [ ] **Step 2: Create `LoginView.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { signIn } from "@/domain/firestore/auth";

export function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await signIn(email, password);
      navigate("/projects");
    } catch {
      setError("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Sign in" footer={<>New here? <Link to="/signup" className="text-accent">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <AuthError message={error} />
        <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex items-center justify-between">
          <Link to="/reset" className="text-xs text-muted hover:text-text">Forgot password?</Link>
          <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </div>
      </form>
    </AuthCard>
  );
}
```

- [ ] **Step 3: Create `SignUpView.tsx`** (same shape; on success show a "check your email to verify" message)

```tsx
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { signUp } from "@/domain/firestore/auth";

export function SignUpView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await signUp(email, password); setDone(true); }
    catch (err) { setError(err instanceof Error && /email-already-in-use/.test(err.message) ? "That email is already registered." : "Could not create the account."); }
    finally { setBusy(false); }
  }

  if (done) {
    return <AuthCard title="Check your email" footer={<Link to="/login" className="text-accent">Back to sign in</Link>}>
      <p className="text-sm text-muted">We sent a verification link to <span className="text-text">{email}</span>. Click it, then sign in.</p>
    </AuthCard>;
  }

  return (
    <AuthCard title="Create your account" footer={<>Already have one? <Link to="/login" className="text-accent">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <AuthError message={error} />
        <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={6} placeholder="Password (min 6 chars)" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>
    </AuthCard>
  );
}
```

- [ ] **Step 4: Create `ResetPasswordView.tsx`** (request a reset email)

```tsx
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { sendReset } from "@/domain/firestore/auth";

export function ResetPasswordView() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null);
    try { await sendReset(email); setSent(true); } catch { setError("Could not send the reset email."); }
  }

  return (
    <AuthCard title="Reset password" footer={<Link to="/login" className="text-accent">Back to sign in</Link>}>
      {sent ? <p className="text-sm text-muted">If an account exists for {email}, a reset link is on its way.</p> : (
        <form onSubmit={submit} className="space-y-3">
          <AuthError message={error} />
          <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
```

- [ ] **Step 5: Create `ActionView.tsx`** (handles Firebase email links: `?mode=verifyEmail|resetPassword&oobCode=…`)

```tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { applyVerify, confirmReset } from "@/domain/firestore/auth";

export function ActionView() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode") ?? "";
  const [status, setStatus] = useState<"working" | "verified" | "reset-form" | "reset-done" | "error">("working");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "verifyEmail" && oobCode) {
      applyVerify(oobCode).then(() => setStatus("verified")).catch(() => setStatus("error"));
    } else if (mode === "resetPassword" && oobCode) {
      setStatus("reset-form");
    } else {
      setStatus("error");
    }
  }, [mode, oobCode]);

  async function submitReset(e: FormEvent) {
    e.preventDefault(); setError(null);
    try { await confirmReset(oobCode, password); setStatus("reset-done"); } catch { setError("That reset link is invalid or expired."); }
  }

  if (status === "verified") return <AuthCard title="Email verified" footer={<Link to="/login" className="text-accent">Sign in</Link>}><p className="text-sm text-muted">Your email is verified. You can sign in now.</p></AuthCard>;
  if (status === "reset-done") return <AuthCard title="Password updated" footer={<Link to="/login" className="text-accent">Sign in</Link>}><p className="text-sm text-muted">Your password has been changed.</p></AuthCard>;
  if (status === "reset-form") return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submitReset} className="space-y-3">
        <AuthError message={error} />
        <Input type="password" required minLength={6} placeholder="New password" aria-label="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </AuthCard>
  );
  if (status === "error") return <AuthCard title="Invalid link" footer={<Link to="/login" className="text-accent">Sign in</Link>}><p className="text-sm text-muted">This link is invalid or has expired.</p></AuthCard>;
  return <AuthCard title="Working…"><p className="text-sm text-muted">One moment…</p></AuthCard>;
}
```

- [ ] **Step 6: Create `UnverifiedView.tsx`**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthCard, AuthError } from "./AuthCard";
import { resendVerification, signOutUser } from "@/domain/firestore/auth";

export function UnverifiedView() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function resend() {
    setError(null);
    try { await resendVerification(); setSent(true); } catch { setError("Could not resend the email."); }
  }
  return (
    <AuthCard title="Verify your email" footer={<button className="text-accent" onClick={() => signOutUser()}>Sign out</button>}>
      <AuthError message={error} />
      <p className="mb-4 text-sm text-muted">Check your inbox for a verification link. Once verified, reload the page.</p>
      <Button className="w-full" onClick={resend} disabled={sent}>{sent ? "Sent ✓" : "Resend verification email"}</Button>
    </AuthCard>
  );
}
```

- [ ] **Step 7: Write `LoginView.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
const signIn = vi.fn();
const navigate = vi.fn();
vi.mock("@/domain/firestore/auth", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("react-router-dom", async (orig) => ({ ...(await orig() as object), useNavigate: () => navigate }));
import { LoginView } from "./LoginView";

test("submitting valid credentials signs in and navigates to /projects", async () => {
  signIn.mockResolvedValue({ uid: "u1" });
  render(<MemoryRouter><LoginView /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
  await userEvent.type(screen.getByLabelText("Password"), "pw123456");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(signIn).toHaveBeenCalledWith("a@b.com", "pw123456");
  expect(navigate).toHaveBeenCalledWith("/projects");
});

test("a failed sign-in shows an error", async () => {
  signIn.mockRejectedValue(new Error("bad"));
  render(<MemoryRouter><LoginView /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
  await userEvent.type(screen.getByLabelText("Password"), "nope");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/wrong email or password/i);
});
```

- [ ] **Step 8: Write `ActionView.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
const applyVerify = vi.fn();
vi.mock("@/domain/firestore/auth", () => ({ applyVerify: (...a: unknown[]) => applyVerify(...a), confirmReset: vi.fn() }));
import { ActionView } from "./ActionView";

test("verifyEmail mode applies the action code and confirms success", async () => {
  applyVerify.mockResolvedValue(undefined);
  render(<MemoryRouter initialEntries={["/action?mode=verifyEmail&oobCode=abc"]}><ActionView /></MemoryRouter>);
  expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
  expect(applyVerify).toHaveBeenCalledWith("abc");
});
```

- [ ] **Step 9: Run, verify PASS** — `bun run test -- auth`, then `bun run type-check`.

- [ ] **Step 10: Commit**

```bash
git add packages/djangobuilder5/src/features/auth
git commit -m "feat(db5): auth screens — login, signup, reset, action handler, unverified"
```

---

## Task 9: Projects dashboard (A+C cards + new-project + MAX_PROJECTS)

**Files:**
- Create: `packages/djangobuilder5/src/features/dashboard/ProjectCard.tsx`
- Create: `packages/djangobuilder5/src/features/dashboard/NewProjectDialog.tsx`
- Create: `packages/djangobuilder5/src/features/dashboard/DashboardView.tsx`
- Create: `packages/djangobuilder5/src/domain/constants.ts`
- Test: `packages/djangobuilder5/src/features/dashboard/DashboardView.test.tsx`

- [ ] **Step 1: Create `src/domain/constants.ts`**

```ts
export const MAX_PROJECTS = 3;
```

- [ ] **Step 2: Create `ProjectCard.tsx`** — the A+C card (code thumbnail + metadata). It renders a `models.py` thumbnail from the project's first app via `renderAppPreview` over the re-nested project.

```tsx
import { Link } from "react-router-dom";
import { useProjectStore } from "@/store/projectStore";
import { renestProject } from "@/domain/firestore/mapper";
import { renderAppPreview } from "@/domain/generate";
import { highlight } from "@/lib/highlight";
import type { ProjectSummary } from "@/domain/firestore/types";

function thumbnailCode(projectId: string): string {
  const data = useProjectStore.getState().data;
  const project = renestProject(data, projectId);
  const app = project?.apps[0];
  if (!app) return "# empty project";
  const files = renderAppPreview(project!, app.id);
  const models = files.find((f) => f.file === "models.py")?.code ?? "";
  return models.split("\n").slice(0, 6).join("\n");
}

export function ProjectCard({ summary }: { summary: ProjectSummary }) {
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const code = thumbnailCode(summary.id);
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-4">
      <Link to={`/project/${summary.id}`} className="absolute inset-0" aria-label={`Open ${summary.name}`} />
      <pre className="mb-3 h-[70px] overflow-hidden rounded-lg border border-border bg-[#090B10] p-2 text-[10px] leading-snug">
        <code className="hljs language-python" dangerouslySetInnerHTML={{ __html: highlight(code, "python") }} />
      </pre>
      <p className="font-bold">{summary.name}</p>
      <p className="mb-3 line-clamp-2 min-h-[32px] text-xs text-muted">{summary.description}</p>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">Django {summary.djangoVersion}</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{summary.appCount} apps</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{summary.modelCount} models</span>
      </div>
      <button
        className="relative z-10 mt-3 self-start text-[11px] text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        onClick={() => { if (confirm(`Delete “${summary.name}”? This cannot be undone.`)) void deleteProject(summary.id); }}
      >
        Delete
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `NewProjectDialog.tsx`** — a lightweight inline form (name, description, Django version, HTMX/Channels), calling `createProject`, then navigating into it.

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProjectStore } from "@/store/projectStore";
import type { DjangoVersionNumber } from "@/domain/firestore/version";

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState<DjangoVersionNumber>(5);
  const [htmx, setHtmx] = useState(true);
  const [channels, setChannels] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const id = await createProject(name.trim(), description.trim(), version, htmx, channels);
    setBusy(false);
    if (id) navigate(`/project/${id}`);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">New project</h2>
        <Input required placeholder="Project name" aria-label="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Description" aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select aria-label="Django version" value={version} onChange={(e) => setVersion(Number(e.target.value) as DjangoVersionNumber)}>
          <option value={5}>Django 5</option><option value={4}>Django 4</option><option value={3}>Django 3</option>
        </Select>
        <div className="flex gap-4 text-sm text-muted">
          <label className="flex items-center gap-2"><input type="checkbox" checked={htmx} onChange={(e) => setHtmx(e.target.checked)} /> HTMX</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={channels} onChange={(e) => setChannels(e.target.checked)} /> Channels</label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create project"}</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create `DashboardView.tsx`** (grid + new-project tile + MAX_PROJECTS guard)

```tsx
import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { MAX_PROJECTS } from "@/domain/constants";
import { ProjectCard } from "./ProjectCard";
import { NewProjectDialog } from "./NewProjectDialog";

export function DashboardView() {
  const summaries = useProjectStore((s) => s.summaries);
  const dataLoaded = useProjectStore((s) => s.dataLoaded);
  const [showNew, setShowNew] = useState(false);
  const atLimit = summaries.length >= MAX_PROJECTS;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Your projects</h1>
          <p className="text-sm text-muted">{summaries.length} of {MAX_PROJECTS}</p>
        </div>
        <button
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
          disabled={atLimit}
          title={atLimit ? `Limit is ${MAX_PROJECTS} projects` : undefined}
          onClick={() => setShowNew(true)}
        >
          + New project
        </button>
      </div>

      {!dataLoaded ? <p className="text-muted">Loading…</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((s) => <ProjectCard key={s.id} summary={s} />)}
          {!atLimit && (
            <button onClick={() => setShowNew(true)} className="flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-accent/40 bg-accent/5 text-sm font-semibold text-accent">
              + New project
            </button>
          )}
        </div>
      )}
      {showNew && !atLimit && <NewProjectDialog onClose={() => setShowNew(false)} />}
    </section>
  );
}
```

- [ ] **Step 5: Write `DashboardView.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";
import { DashboardView } from "./DashboardView";
import { useProjectStore } from "@/store/projectStore";

function summary(id: string, name: string) {
  return { id, name, description: "d", djangoVersion: 5, channels: false, htmx: true, appCount: 1, modelCount: 2 };
}
beforeEach(() => {
  useProjectStore.setState({ dataLoaded: true, data: { projects: {}, apps: {}, models: {}, fields: {}, relationships: {} } } as never);
});

test("renders a card per project summary with counts", () => {
  useProjectStore.setState({ summaries: [summary("p1", "Blog"), summary("p2", "Shop")] } as never);
  render(<MemoryRouter><DashboardView /></MemoryRouter>);
  expect(screen.getByText("Blog")).toBeInTheDocument();
  expect(screen.getByText("Shop")).toBeInTheDocument();
  expect(screen.getAllByText("2 models")).toHaveLength(2);
});

test("disables New project at the MAX_PROJECTS limit", () => {
  useProjectStore.setState({ summaries: [summary("1", "A"), summary("2", "B"), summary("3", "C")] } as never);
  render(<MemoryRouter><DashboardView /></MemoryRouter>);
  expect(screen.getByRole("button", { name: /new project/i })).toBeDisabled();
});
```

- [ ] **Step 6: Run, verify PASS** — `bun run test -- Dashboard`, then `bun run type-check`.

- [ ] **Step 7: Commit**

```bash
git add packages/djangobuilder5/src/features/dashboard packages/djangobuilder5/src/domain/constants.ts
git commit -m "feat(db5): projects dashboard — code-thumbnail cards, new project, MAX_PROJECTS"
```

---

## Task 10: App routing + auth gate + entry + TopNav

**Files:**
- Rewrite: `packages/djangobuilder5/src/app/App.tsx`
- Rewrite: `packages/djangobuilder5/src/app/App.test.tsx`
- Modify: `packages/djangobuilder5/src/main.tsx`
- Rewrite: `packages/djangobuilder5/src/components/TopNav.tsx`

- [ ] **Step 1: Rewrite `App.tsx`** with the auth gate + routes + data subscription lifecycle.

```tsx
import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Splash } from "@/features/splash/Splash";
import { BuilderPage } from "@/features/builder/BuilderPage";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { LoginView } from "@/features/auth/LoginView";
import { SignUpView } from "@/features/auth/SignUpView";
import { ResetPasswordView } from "@/features/auth/ResetPasswordView";
import { ActionView } from "@/features/auth/ActionView";
import { UnverifiedView } from "@/features/auth/UnverifiedView";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { isVerified } from "@/domain/firestore/auth";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

function Gate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isVerified(user)) return <Navigate to="/unverified" replace />;
  return <>{children}</>;
}

export function App() {
  const authLoaded = useAuthStore((s) => s.authLoaded);
  const user = useAuthStore((s) => s.user);
  const start = useProjectStore((s) => s.start);
  const stop = useProjectStore((s) => s.stop);

  // start/stop the Firestore data subscription with the signed-in user
  useEffect(() => {
    if (user) start(user);
    else stop();
  }, [user, start, stop]);

  if (!authLoaded) return <div className="flex h-full items-center justify-center text-muted">Loading…</div>;

  return (
    <BrowserRouter basename={basename}>
      <div className="flex h-full flex-col">
        <TopNav />
        <main className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/signup" element={<SignUpView />} />
            <Route path="/reset" element={<ResetPasswordView />} />
            <Route path="/action" element={<ActionView />} />
            <Route path="/unverified" element={<UnverifiedView />} />
            <Route path="/projects" element={<Gate><DashboardView /></Gate>} />
            <Route path="/project/:id" element={<Gate><BuilderPage /></Gate>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Update `main.tsx`** to init auth before render.

```tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { applyTheme, getInitialTheme } from "@/lib/theme";
import { initAuth } from "@/store/authStore";

applyTheme(getInitialTheme());
initAuth();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Rewrite `TopNav.tsx`** — show the user's email + Sign out when signed in, Sign in link otherwise.

```tsx
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { signOutUser } from "@/domain/firestore/auth";

export function TopNav() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  async function out() { await signOutUser(); navigate("/"); }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <Link to={user ? "/projects" : "/"} className="text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm text-muted">
        {user && <Link to="/projects" className="hover:text-text">Projects</Link>}
        <a href="https://docs.djangoproject.com" target="_blank" rel="noopener noreferrer" title="Opens in a new tab" className="inline-flex items-center gap-1 hover:text-text">
          Docs
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" />
          </svg>
        </a>
        {user ? (
          <>
            {!user.isAnonymous && <span className="hidden text-muted sm:inline">{user.email}</span>}
            <button className="font-semibold text-accent" onClick={out}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className="font-semibold text-accent">Sign in</Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Rewrite `App.test.tsx`** (mock the stores + auth)

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("@/store/authStore", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: null, authLoaded: true }),
  initAuth: vi.fn(),
}));
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: unknown) => unknown) => sel({ start: vi.fn(), stop: vi.fn(), summaries: [], dataLoaded: true, project: null }),
}));
import { App } from "./App";

beforeEach(() => vi.clearAllMocks());

test("renders the brand and the splash on / when signed out", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: /djangobuilder/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /ship the django/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run, verify PASS** — `bun run test -- App`, then the full suite `bun run test`, `bun run type-check`, `bun run lint`, `bun run build`.

- [ ] **Step 6: Commit**

```bash
git add packages/djangobuilder5/src/app packages/djangobuilder5/src/main.tsx packages/djangobuilder5/src/components/TopNav.tsx
git commit -m "feat(db5): auth-gated routing, data subscription lifecycle, top nav session"
```

---

## Task 11: Full verification + dev-project gate + review

**Files:** none (verification + optional docs)

- [ ] **Step 1: Full package gates**

Run, all must pass:
- `cd /home/mark/devel/django_builder && bun run test_v5`
- `bun run --filter=djangobuilder5 type-check`
- `bun run lint_v5`
- `bun run build_v5`
- Aggregate: `bun run lint && bun run test` (confirm the whole repo is still green).

- [ ] **Step 2: Manual end-to-end against `django-builder-dev`** (the real gate for the Firebase paths the mocked tests can't cover)

Run `bun run dev5`, open `http://localhost:8081`, and verify:
- Sign up → "check your email" screen; verify via the emailed link → `/action` shows "Email verified"; sign in → `/projects`.
- Dashboard shows existing dev-account projects (if any) with code-thumbnail cards.
- Create a project (respecting the 3-project cap) → lands in the builder → add app/model/field → reload → changes persisted → confirm the same project opens in the live app (`bun run dev`).
- Delete a project → it and its descendants disappear (check Firestore console: no orphaned apps/models/fields/relationships).
- "Start building — free" on the splash → anonymous session → `/projects`.
- Sign out → back to splash; signed-out access to `/projects` redirects to `/login`.

Record the outcome in the final change summary. If any Firebase-path bug surfaces here, fix it and add/adjust a mocked-service test that would have caught it.

- [ ] **Step 3: Commit any fixes from Step 2, then stop.**

```bash
git add -A packages/djangobuilder5
git commit -m "fix(db5): address M2 end-to-end findings"   # only if Step 2 found issues
```

---

## Self-review (against the M2 spec)

**Spec coverage:**
- Share live data (same project + 5 collections + owner) → Tasks 1,4,5. ✅
- Pure flatten/re-nest mapper + `3|4|5 ↔ 3.2/4.1/5.1` → Tasks 1,2. ✅ (flatten dropped — projects are built incrementally; noted in header.)
- Auto-save write-through builder + debounced text → Tasks 6,7. ✅
- Full email auth + anonymous + verification/action codes + gate → Tasks 3,8,10. ✅
- Dashboard A+C cards + create/open/delete + `MAX_PROJECTS` → Task 9. ✅
- Isolation (only `firestore/*` + `lib/firebase.ts` touch Firebase) → Tasks 1–5; stores/screens consume services. ✅
- Drop `postgres` → Task 1. ✅
- Cascade delete with correct `relationships`; default fields → Task 5. ✅
- Testing: pure mapper + mocked-service + component tests; dev-project manual gate → all tasks + Task 11. ✅ (Emulator → mocked-firestore deviation flagged in header.)

**Type/name consistency:** `FlatData`/`emptyFlatData`, `ProjectDoc`… (`firestore/types.ts`); `renestProject`/`projectSummary` (`mapper.ts`); `toVersionNumber`/`fromVersion`/`DjangoVersionNumber` (`version.ts`); `subscribeAll` (`data.ts`); `createProject/addApp/addModel/addField/addRelationship/update*/removeField/removeRelationship/removeModel/deleteProjectCascade` (`writes.ts`); `onAuth/isVerified/signIn/signUp/signInAnon/signOutUser/sendReset/resendVerification/applyVerify/confirmReset` (`auth.ts`); `useAuthStore/initAuth`; `useProjectStore` with `start/stop/openProject/select/createProject/deleteProject/setProjectName/setDjangoVersion/setFlag/addApp/addModel/removeModel/addField/updateField/removeField/addRelationship/updateRelationship/removeRelationship` and derived `project/summaries/dataLoaded/currentProjectId`. Builder components keep the M1 action signatures `(appId, modelId[, fieldId], patch?)`. Referenced consistently.

**Known deferrals (M3):** GitHub auth; canvas/ERD; project duplicate; real thumbnails; parents-editing UI (parents preserved, never clobbered); model-move UI.
