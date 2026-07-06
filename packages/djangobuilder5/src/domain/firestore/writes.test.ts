import { beforeEach, expect, test, vi } from "vitest";

const batch = vi.hoisted(() => ({ delete: vi.fn(), update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }));
const fns = vi.hoisted(() => ({
  addDoc: vi.fn().mockResolvedValue({ id: "new1" }),
  collection: vi.fn((_db, name: string) => ({ name })),
  doc: vi.fn((_db, coll: string, id: string) => ({ coll, id })),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteField: vi.fn(() => "DELETE"),
  writeBatch: vi.fn(() => batch),
}));
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
