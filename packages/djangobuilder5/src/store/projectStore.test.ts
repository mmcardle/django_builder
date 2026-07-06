import { beforeEach, expect, test, vi } from "vitest";

let snapshotCb: ((d: unknown, allLoaded: boolean) => void) | null = null;
vi.mock("@/domain/firestore/data", () => ({
  subscribeAll: (_u: unknown, cb: (d: unknown, allLoaded: boolean) => void) => { snapshotCb = cb; return () => {}; },
}));
const writes = vi.hoisted(() => ({
  createProject: vi.fn().mockResolvedValue("p1"), deleteProjectCascade: vi.fn(),
  addApp: vi.fn(), addModel: vi.fn(), removeModel: vi.fn(),
  addField: vi.fn(), updateField: vi.fn(), removeField: vi.fn(),
  addRelationship: vi.fn(), updateRelationship: vi.fn(), removeRelationship: vi.fn(),
  updateProject: vi.fn(),
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

test("createProject delegates to the service with the current user", async () => {
  await useProjectStore.getState().createProject("Shop", "d", 5, false, false);
  expect(writes.createProject).toHaveBeenCalledWith({ uid: "u" }, "Shop", "d", 5, false, false);
});
