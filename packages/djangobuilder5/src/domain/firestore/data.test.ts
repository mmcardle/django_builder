import { beforeEach, expect, test, vi } from "vitest";

const snapCbs: Record<string, (snap: unknown) => void> = vi.hoisted(() => ({}));
const fns = vi.hoisted(() => ({
  collection: vi.fn((_db, name: string) => ({ name })),
  query: vi.fn((c) => c),
  where: vi.fn(() => ["where"]),
  orderBy: vi.fn(() => ["order"]),
  onSnapshot: vi.fn((q: { name: string }, cb: (s: unknown) => void) => {
    snapCbs[q.name] = cb;
    return () => delete snapCbs[q.name];
  }),
}));
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

test("reports allLoaded only after all five collections' initial snapshots", () => {
  const flags: boolean[] = [];
  subscribeAll({ uid: "u1" } as never, (_d, all) => flags.push(all));
  ["projects", "apps", "models", "fields"].forEach((c) => snapCbs[c](change("added", "x", {})));
  expect(flags.at(-1)).toBe(false); // 4 of 5
  snapCbs.relationships(change("added", "y", {}));
  expect(flags.at(-1)).toBe(true); // all 5
});
