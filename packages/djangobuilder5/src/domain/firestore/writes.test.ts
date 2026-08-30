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
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
    query: vi.fn((...args: unknown[]) => args),
    where: vi.fn((field: string, _op: string, value: unknown) => ({ field, value })),
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
  fns.getDocs.mockResolvedValue({ docs: [] });
});

/** A model with `fieldCount` fields, for exercising the batch-size limit. */
const bigModel = (id: string, fieldCount: number) => ({
  id, name: `M${id}`, abstract: false, parents: [],
  fields: Array.from({ length: fieldCount }, (_, i) => ({ id: `${id}f${i}`, name: `f${i}`, type: "CharField", args: "" })),
  relationships: [],
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

test("importModels batches each model with its fields/relationships and links them to the app", async () => {
  await w.importModels(U, "a1", [
    {
      name: "Post", abstract: false,
      fields: [{ name: "title", type: "CharField", args: "max_length=200" }],
      relationships: [{ name: "author", type: "ForeignKey", to: "auth.User", args: "" }],
    },
  ]);
  const modelSet = batch.set.mock.calls.find((c) => c[1].name === "Post");
  expect(modelSet![1]).toMatchObject({ owner: "u1", name: "Post", abstract: false, parents: [] });
  expect(batch.set.mock.calls.find((c) => c[1].name === "title")![1]).toMatchObject({ owner: "u1", type: "CharField" });
  expect(batch.set.mock.calls.find((c) => c[1].name === "author")![1]).toMatchObject({ owner: "u1", to: "auth.User" });
  expect(batch.update).toHaveBeenCalled(); // app link
  expect(batch.commit).toHaveBeenCalledOnce();
});

test("moveModel flips the model key between the source and target apps", async () => {
  await w.moveModel("a1", "a2", "m1", [{ id: "r1", to: "shop.Post" }]);
  expect(batch.update).toHaveBeenCalledWith({ coll: "relationships", id: "r1" }, { to: "shop.Post" });
  expect(batch.update).toHaveBeenCalledWith({ coll: "apps", id: "a1" }, { "models.m1": "DELETE" });
  expect(batch.update).toHaveBeenCalledWith({ coll: "apps", id: "a2" }, { "models.m1": true });
  expect(batch.commit).toHaveBeenCalledOnce();
});

test("removeApp batches the app's descendants, the app doc, and the project map key", async () => {
  await w.removeApp("p1", {
    id: "a1",
    models: [
      { id: "m1", name: "Post", abstract: false, parents: [],
        fields: [{ id: "f1", name: "t", type: "CharField", args: "" }],
        relationships: [{ id: "r1", name: "a", type: "ForeignKey", to: "auth.User", args: "" }] },
    ],
  });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "relationships", id: "r1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "fields", id: "f1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "models", id: "m1" });
  expect(batch.delete).toHaveBeenCalledWith({ coll: "apps", id: "a1" });
  expect(batch.update).toHaveBeenCalledWith({ coll: "projects", id: "p1" }, { "apps.a1": "DELETE" });
  expect(batch.commit).toHaveBeenCalledOnce();
});

test("deleteProjectCascade batches every descendant using the plural relationships collection", async () => {
  await w.deleteProjectCascade({
    id: "p1",
    apps: [{ id: "a1", name: "blog", models: [{ id: "m1", name: "Post", abstract: false, parents: [],
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

test("renameApp writes the new name and repoints the stale relationship targets", async () => {
  await w.renameApp("a1", "weblog", [{ id: "r1", to: "weblog.Post" }]);
  expect(batch.update).toHaveBeenCalledWith({ coll: "apps", id: "a1" }, { name: "weblog" });
  expect(batch.update).toHaveBeenCalledWith({ coll: "relationships", id: "r1" }, { to: "weblog.Post" });
  expect(batch.commit).toHaveBeenCalledOnce();
});

test("renameModel writes the new name and repoints the stale relationship targets", async () => {
  await w.renameModel("m1", "Article", [{ id: "r1", to: "blog.Article" }]);
  expect(batch.update).toHaveBeenCalledWith({ coll: "models", id: "m1" }, { name: "Article" });
  expect(batch.update).toHaveBeenCalledWith({ coll: "relationships", id: "r1" }, { to: "blog.Article" });
  expect(batch.commit).toHaveBeenCalledOnce();
});

test("importModels of zero models writes nothing", async () => {
  await w.importModels(U, "a1", []);
  expect(batch.commit).not.toHaveBeenCalled();
  expect(batch.update).not.toHaveBeenCalled();
});

test("importModels splits a run past the batch limit across several commits", async () => {
  // 60 models x 9 fields = 600 writes + 60 model docs + 1 app link, over the 450 cap.
  const models = Array.from({ length: 60 }, (_, m) => ({
    name: `Model${m}`, abstract: false, relationships: [],
    fields: Array.from({ length: 9 }, (_, f) => ({ name: `f${f}`, type: "CharField", args: "" })),
  }));
  await w.importModels(U, "a1", models);
  expect(batch.set).toHaveBeenCalledTimes(600);
  expect(batch.commit.mock.calls.length).toBeGreaterThan(1);
  // the app link is the very last write, so a failed chunk can't reveal missing models
  expect(batch.update).toHaveBeenCalledOnce();
});

test("deleteProjectCascade splits a large project across several commits", async () => {
  // 3 apps x 20 models x (1 model + 20 fields) = 1260 deletes + 3 apps + 1 project.
  const apps = Array.from({ length: 3 }, (_, a) => ({
    id: `a${a}`, name: `app${a}`,
    models: Array.from({ length: 20 }, (_, m) => bigModel(`a${a}m${m}`, 20)),
  }));
  await w.deleteProjectCascade({ id: "p1", apps } as never);
  expect(batch.delete).toHaveBeenCalledTimes(1264);
  expect(batch.commit.mock.calls.length).toBeGreaterThan(1);
});

test("removeApp splits a large app across several commits", async () => {
  const models = Array.from({ length: 40 }, (_, m) => bigModel(`m${m}`, 20));
  await w.removeApp("p1", { id: "a1", models } as never);
  expect(batch.delete).toHaveBeenCalledTimes(841); // 40 models + 800 fields + the app doc
  expect(batch.commit.mock.calls.length).toBeGreaterThan(1);
});

test("deleteAllUserData deletes every owned doc across the five collections", async () => {
  fns.getDocs.mockResolvedValue({ docs: [{ id: "d1" }, { id: "d2" }] });
  await w.deleteAllUserData("u1");
  expect(fns.where).toHaveBeenCalledWith("owner", "==", "u1");
  ["relationships", "fields", "models", "apps", "projects"].forEach((coll) => {
    expect(batch.delete).toHaveBeenCalledWith({ coll, id: "d1" });
    expect(batch.delete).toHaveBeenCalledWith({ coll, id: "d2" });
  });
  expect(batch.commit).toHaveBeenCalledOnce();
});
