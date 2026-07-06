import { beforeEach, expect, test, vi } from "vitest";

const batch = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn(), update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }));
const fns = vi.hoisted(() => {
  let docId = 0;
  return {
    addDoc: vi.fn().mockResolvedValue({ id: "new1" }),
    collection: vi.fn((_db, name: string) => ({ name })),
    // 3-arg doc(db, coll, id) -> {coll,id}; 1-arg doc(collectionRef) -> generated id
    doc: vi.fn((a: { name?: string }, coll?: string, id?: string) =>
      coll === undefined ? { coll: a.name, id: `gen${docId++}` } : { coll, id },
    ),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteField: vi.fn(() => "DELETE"),
    writeBatch: vi.fn(() => batch),
  };
});
vi.mock("firebase/firestore", () => fns);
vi.mock("@/lib/firebase", () => ({ db: {} }));

import * as w from "./writes";
const U = { uid: "u1" } as never;

beforeEach(() => {
  [batch.set, batch.delete, batch.update, batch.commit].forEach((f) => f.mockClear());
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

test("addModel batches the model + app link + two default fields atomically", async () => {
  const id = await w.addModel(U, "a1", "Post");
  // model doc set with owner + a fields map holding the two default field ids
  const modelSet = batch.set.mock.calls.find((c) => c[1].name === "Post");
  expect(modelSet![1]).toMatchObject({ owner: "u1", name: "Post", abstract: false });
  expect(Object.keys(modelSet![1].fields)).toHaveLength(2);
  // app link written in the same batch
  expect(batch.update).toHaveBeenCalledWith({ coll: "apps", id: "a1" }, { [`models.${id}`]: true });
  // two default DateTimeField docs set (created + last_updated)
  const fieldSets = batch.set.mock.calls.filter((c) => c[1].type === "DateTimeField");
  expect(fieldSets.map((c) => c[1].name)).toEqual(["created", "last_updated"]);
  // exactly one commit (atomic)
  expect(batch.commit).toHaveBeenCalledOnce();
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
