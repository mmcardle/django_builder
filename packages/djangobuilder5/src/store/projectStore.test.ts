import { beforeEach, expect, test, vi } from "vitest";

let snapshotCb: ((d: unknown, allLoaded: boolean) => void) | null = null;
let errorCb: ((e: unknown) => void) | null = null;
vi.mock("@/domain/firestore/data", () => ({
  subscribeAll: (
    _u: unknown,
    cb: (d: unknown, allLoaded: boolean) => void,
    onError: (e: unknown) => void,
  ) => { snapshotCb = cb; errorCb = onError; return () => {}; },
}));
const writes = vi.hoisted(() => ({
  createProject: vi.fn().mockResolvedValue("p1"), deleteProjectCascade: vi.fn(),
  addApp: vi.fn(), renameApp: vi.fn(), removeApp: vi.fn(), renameModel: vi.fn(), addModel: vi.fn(), importModels: vi.fn(), updateModel: vi.fn(),
  setModelParents: vi.fn(), moveModel: vi.fn(), removeModel: vi.fn(),
  addField: vi.fn(), updateField: vi.fn(), removeField: vi.fn(),
  addRelationship: vi.fn(), updateRelationship: vi.fn(), removeRelationship: vi.fn(),
  updateProject: vi.fn(), deleteAllUserData: vi.fn(),
}));
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
  snapshotCb!(FLAT, true);
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

test("setDescription write-through updates the current project's description", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().setDescription("A blog about cats");
  expect(writes.updateProject).toHaveBeenCalledWith("p1", { description: "A blog about cats" });
});

test("updateModel write-through forwards the patch by model id", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().updateModel("a1", "m1", { name: "Article", abstract: true });
  expect(writes.updateModel).toHaveBeenCalledWith("m1", { name: "Article", abstract: true });
});

test("setModelParents write-through forwards the parents by model id", () => {
  useProjectStore.getState().openProject("p1");
  const parents = [{ type: "django", class: "django.contrib.auth.models.User" }] as never;
  useProjectStore.getState().setModelParents("a1", "m1", parents);
  expect(writes.setModelParents).toHaveBeenCalledWith("m1", parents);
});

test("importModels delegates to the service for the current user", () => {
  useProjectStore.getState().openProject("p1");
  const models = [{ name: "X", abstract: false, fields: [], relationships: [] }];
  useProjectStore.getState().importModels("a1", models);
  expect(writes.importModels).toHaveBeenCalledWith({ uid: "u" }, "a1", models);
});

test("moveModel delegates the re-parent to the service", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().moveModel("a1", "a2", "m1");
  expect(writes.moveModel).toHaveBeenCalledWith("a1", "a2", "m1", []);
});

test("removeApp cascades the current project's app", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().removeApp("a1");
  expect(writes.removeApp).toHaveBeenCalledWith("p1", expect.objectContaining({ id: "a1", name: "blog" }), []);
});

test("createProject delegates to the service with the current user", async () => {
  await useProjectStore.getState().createProject("Shop", "d", 5, false, false);
  expect(writes.createProject).toHaveBeenCalledWith({ uid: "u" }, "Shop", "d", 5, false, false);
});

test("renameApp write-through renames the app and repoints its relationships", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().renameApp("a1", "weblog");
  expect(writes.renameApp).toHaveBeenCalledWith("a1", "weblog", []);
});

test("renameModel repoints the relationships that targeted the old name", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().renameModel("a1", "m1", "Article");
  expect(writes.renameModel).toHaveBeenCalledWith("m1", "Article", []);
});

test("deleteAllData wipes everything owned by the signed-in user", async () => {
  await useProjectStore.getState().deleteAllData();
  expect(writes.deleteAllUserData).toHaveBeenCalledWith("u");
});

test("deleteAllData is a no-op when nobody is signed in", async () => {
  useProjectStore.getState().stop();
  await useProjectStore.getState().deleteAllData();
  expect(writes.deleteAllUserData).not.toHaveBeenCalled();
});

test("removeModel passes the inbound relationships that must die with the model", () => {
  useProjectStore.getState().openProject("p1");
  useProjectStore.getState().removeModel("a1", "m1");
  expect(writes.removeModel).toHaveBeenCalledWith("a1", expect.objectContaining({ id: "m1" }), []);
});

test("a failing snapshot listener is recorded as a dismissible load error", () => {
  errorCb!(new Error("Missing or insufficient permissions."));
  expect(useProjectStore.getState().loadError).toBe("Missing or insufficient permissions.");
  useProjectStore.getState().dismissLoadError();
  expect(useProjectStore.getState().loadError).toBeNull();
});
