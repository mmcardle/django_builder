# djangobuilder5 — Milestone 3 Implementation Plan (deploy to dev + review minors)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix the subpath deploy issues + the four deferred M2 review minors, then deploy db5 under `/db5/` to the development Firebase project and verify it live.

**Architecture:** Small, targeted edits to the existing db5 Firestore/auth layer + one index.html favicon; then the existing `make deploy name=development` pipeline publishes the assembled site (io at `/`, `/db4/`, `/db5/`) to `django-builder-dev`.

**Tech Stack:** existing db5 (React/Vite/TS/Firebase modular), Vitest; Firebase Hosting via `firebase-tools`.

**Execution:** Inline. Reference spec: `docs/superpowers/specs/2026-07-06-djangobuilder5-milestone-3-deploy-design.md`.

---

## Task 1: Subpath auth continue-URL + favicon

**Files:** Modify `src/domain/firestore/auth.ts`, `index.html`.

- [ ] Change `auth.ts` line 29 from
  `const verifyActionSettings = () => ({ url: \`${window.location.origin}/login\` });`
  to `const verifyActionSettings = () => ({ url: \`${window.location.origin}${import.meta.env.BASE_URL}login\` });`
- [ ] In `index.html` `<head>`, add an inline SVG favicon:
  `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230B0D12'/><text x='16' y='22' font-size='18' font-family='monospace' font-weight='bold' text-anchor='middle' fill='%233ECF8E'>db</text></svg>" />`
- [ ] `bun run test` green, `bun run type-check` clean, `bun run build` clean.
- [ ] Commit: `feat(db5): base-aware auth continue URL + favicon`.

## Task 2: snapshotErrorHandler — log, not throw

**Files:** Modify `src/lib/firebase.ts`.

- [ ] Replace the body:
  ```ts
  export function snapshotErrorHandler(error: unknown): void {
    if (auth.currentUser) console.error("[db5] snapshot error", error);
  }
  ```
- [ ] `bun run type-check` + `bun run test` green. (No dedicated test — mocked everywhere; behavior is a 2-line log.)
- [ ] Commit: `fix(db5): snapshot error handler logs instead of throwing`.

## Task 3: All-collections-loaded guard

**Files:** Modify `src/domain/firestore/data.ts`, `src/store/projectStore.ts`; update `src/domain/firestore/data.test.ts`, `src/store/projectStore.test.ts`.

- [ ] `data.ts`: change `subscribeAll(user, onData)` so `onData` is `(data: FlatData, allLoaded: boolean) => void`. Track `const loaded = new Set<string>()`; in each collection's snapshot callback, after applying `docChanges`, `loaded.add(name)` and call `onData(structuredClone(data), loaded.size === COLLECTIONS.length)`.
- [ ] `projectStore.ts` `start()`: `subscribeAll(user, (data, allLoaded) => set((s) => ({ data, dataLoaded: allLoaded, ...recompute({ ...s, data }) })))`.
- [ ] `data.test.ts`: update the accumulation test's callback to capture both args; add a test that after firing all 5 collections' snapshots the last call reports `allLoaded === true`, and that a single collection's snapshot reports `false`.
- [ ] `projectStore.test.ts`: update `snapshotCb!(FLAT)` calls to `snapshotCb!(FLAT, true)` (so `dataLoaded` becomes true).
- [ ] `bun run test` green, `type-check` clean.
- [ ] Commit: `fix(db5): dataLoaded waits for all five initial snapshots`.

## Task 4: UnverifiedView refresh button

**Files:** Modify `src/domain/firestore/auth.ts`, `src/features/auth/UnverifiedView.tsx`; test `src/features/auth/UnverifiedView.test.tsx`.

- [ ] `auth.ts`: add
  ```ts
  export async function reloadUser(): Promise<User | null> {
    if (auth.currentUser) await auth.currentUser.reload();
    return auth.currentUser;
  }
  ```
- [ ] `UnverifiedView.tsx`: add an "I've verified — refresh" button that calls `reloadUser()`, then `useAuthStore.getState().setUser(user)`, and if `isVerified(user)` `navigate("/projects")`. (Imports: `reloadUser`, `isVerified` from `@/domain/firestore/auth`; `useAuthStore`; `useNavigate`.)
- [ ] Test `UnverifiedView.test.tsx`: mock `@/domain/firestore/auth` (`reloadUser` resolves a verified user, `isVerified` → true, `resendVerification`/`signOutUser` stubs) and `@/store/authStore`; assert clicking the refresh button calls `reloadUser` and navigates to `/projects`.
- [ ] `bun run test` green, `type-check` clean.
- [ ] Commit: `feat(db5): unverified screen self-refresh after verifying`.

## Task 5: addModel atomic batch

**Files:** Modify `src/domain/firestore/writes.ts`; update `src/domain/firestore/writes.test.ts`.

- [ ] Rewrite `addModel` to one `writeBatch`:
  ```ts
  export async function addModel(user: User, appId: string, name: string): Promise<string> {
    const batch = writeBatch(db);
    const modelRef = doc(collection(db, "models"));
    const defaults = [
      { name: "created", args: "auto_now_add=True, editable=False" },
      { name: "last_updated", args: "auto_now=True, editable=False" },
    ];
    const fieldsMap: Record<string, boolean> = {};
    const fieldOps: { ref: ReturnType<typeof doc>; data: object }[] = [];
    for (const d of defaults) {
      const fieldRef = doc(collection(db, "fields"));
      fieldsMap[fieldRef.id] = true;
      fieldOps.push({ ref: fieldRef, data: { owner: user.uid, name: d.name, type: "DateTimeField", args: d.args } });
    }
    batch.set(modelRef, { owner: user.uid, name, abstract: false, parents: [], fields: fieldsMap, relationships: {} });
    batch.update(doc(db, "apps", appId), { [`models.${modelRef.id}`]: true });
    fieldOps.forEach((op) => batch.set(op.ref, op.data));
    await batch.commit();
    return modelRef.id;
  }
  ```
  (Add `collection` to the firestore imports if not present.)
- [ ] `writes.test.ts`: rewrite the addModel test for the batch shape. Update the mock so `doc(collectionRef)` (one arg) returns a ref with a generated id (e.g. `doc: vi.fn((a, coll, id) => (coll === undefined ? { coll: a.name, id: \`gen${idCounter++}\` } : { coll, id }))`), and assert: `batch.set` called for the model (owner, `fields` map with two keys) + two field docs (`DateTimeField`, `created`/`last_updated`), `batch.update` for the app map key, one `batch.commit()`.
- [ ] `bun run test` green, `type-check` clean.
- [ ] Commit: `refactor(db5): atomic batched addModel with default fields`.

## Task 6: Full db5 gates

- [ ] `cd packages/djangobuilder5 && bun run test` (all green), `bun run type-check`, `bun run lint`, `bun run build`.
- [ ] Root aggregate: `bun run lint && bun run test` (whole repo green).

## Task 7: Deploy to development

- [ ] From repo root run `make deploy name=development`. It runs `firebase use development`, `bun run build_development` (io+v4+v5), assembles `dist_development/` with `db4/`+`db5/`, and `firebase deploy --public=dist_development` to `django-builder-dev`.
- [ ] Capture the deployed Hosting URL from the CLI output. If the deploy errors because Hosting isn't enabled on the dev project, STOP and report — do not force-enable anything.

## Task 8: Live verification

- [ ] Load `https://django-builder-dev.web.app/db5/` in the browser; smoke-test: splash → "Start building" (anonymous) → dashboard → create project → add app/model → reload (persistence). Confirm a direct `/db5/<route>` deep link resolves (Firebase rewrite). Screenshot.
- [ ] Report the live URL + outcome; commit any fix needed with a focused message.

---

## Self-review (against the spec)
- Subpath continue-URL (spec A1) → T1. Favicon (A2) → T1. snapshotErrorHandler (B3) → T2. All-loaded guard (B4) → T3. Unverified refresh (B5) → T4. addModel batch (B6) → T5. Deploy dev (C) → T7. Live verify (D) → T8. Tests → each task + T6. ✅
- No placeholders; signatures consistent (`subscribeAll(user, (data, allLoaded)=>…)`, `reloadUser(): Promise<User|null>`, `addModel(user, appId, name): Promise<string>`).
