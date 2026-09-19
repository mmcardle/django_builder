import { expect, test } from "vitest";
import { buildCoreProject } from "./buildCoreProject";
import { projectFileTree } from "./generate";
import {
  inboundForAppDelete,
  inboundForModelDelete,
  retargetsForAppRename,
  retargetsForModelMove,
  retargetsForModelRename,
} from "./relationshipIntegrity";
import type { LocalProject } from "./types";

const rel = (id: string, to: string) => ({ id, name: `r_${id}`, type: "ForeignKey", to, args: "" });
const model = (id: string, name: string, relationships: ReturnType<typeof rel>[] = []) => ({
  id, name, abstract: false, parents: [], fields: [], relationships,
});

/** blog.Comment -> blog.Post, and shop.Order -> blog.Post (cross-app). */
const project = (): LocalProject =>
  ({
    id: "p1", name: "Site", description: "", djangoVersion: 5, channels: false, htmx: false,
    apps: [
      { id: "a1", name: "blog", models: [model("m1", "Post"), model("m2", "Comment", [rel("r1", "blog.Post")])] },
      { id: "a2", name: "shop", models: [model("m3", "Order", [rel("r2", "blog.Post"), rel("r3", "auth.User")])] },
    ],
  }) as LocalProject;

test("renaming an app repoints every relationship targeting its models, across apps", () => {
  expect(retargetsForAppRename(project(), "a1", "weblog")).toEqual([
    { id: "r1", to: "weblog.Post" },
    { id: "r2", to: "weblog.Post" },
  ]);
});

test("renaming a model repoints only the relationships aimed at that model", () => {
  expect(retargetsForModelRename(project(), "a1", "m1", "Article")).toEqual([
    { id: "r1", to: "blog.Article" },
    { id: "r2", to: "blog.Article" },
  ]);
});

test("moving a model to another app repoints relationships to its new qualified name", () => {
  expect(retargetsForModelMove(project(), "a1", "a2", "m1")).toEqual([
    { id: "r1", to: "shop.Post" },
    { id: "r2", to: "shop.Post" },
  ]);
});

test("built-in targets like auth.User are never rewritten", () => {
  const all = [
    ...retargetsForAppRename(project(), "a1", "weblog"),
    ...retargetsForModelRename(project(), "a1", "m1", "Article"),
  ];
  expect(all.some((r) => r.id === "r3")).toBe(false);
});

test("a no-op rename produces no writes", () => {
  expect(retargetsForAppRename(project(), "a1", "blog")).toEqual([]);
  expect(retargetsForModelRename(project(), "a1", "m1", "Post")).toEqual([]);
  expect(retargetsForModelMove(project(), "a1", "a1", "m1")).toEqual([]);
});

test("an unknown app or model yields no writes rather than throwing", () => {
  expect(retargetsForAppRename(project(), "nope", "x")).toEqual([]);
  expect(retargetsForModelRename(project(), "a1", "nope", "x")).toEqual([]);
  expect(retargetsForModelMove(project(), "a1", "nope", "m1")).toEqual([]);
});

/** The reason these helpers exist: a stale `to` makes the project unrenderable,
 * and the builder renders its file tree unguarded. */
test("applying the retargets keeps the project buildable after a rename", () => {
  const renamed = project();
  const retargets = retargetsForAppRename(renamed, "a1", "weblog");
  renamed.apps[0].name = "weblog";

  // Tolerated rather than fatal (snapshots for the five collections interleave),
  // but the relationship is missing from the generated code until it is repointed.
  const stale = buildCoreProject(renamed);
  expect(stale.apps[0].models[1].relationships).toHaveLength(0);

  for (const app of renamed.apps) {
    for (const m of app.models) {
      for (const r of m.relationships) {
        const hit = retargets.find((t) => t.id === r.id);
        if (hit) r.to = hit.to;
      }
    }
  }
  const fixed = buildCoreProject(renamed);
  expect(fixed.apps[0].models[1].relationships[0].relatedTo()).toBe("weblog.Post");
});

test("an unresolved target is skipped, never fatal — the builder renders the tree unguarded", () => {
  const broken = project();
  broken.apps[0].name = "weblog";
  expect(() => projectFileTree(broken)).not.toThrow();
});

test("deleting a model collects the relationships elsewhere that point at it", () => {
  // r1 (blog.Comment) and r2 (shop.Order) both target blog.Post
  expect(inboundForModelDelete(project(), "a1", "m1")).toEqual([
    { modelId: "m2", relId: "r1" },
    { modelId: "m3", relId: "r2" },
  ]);
});

test("a model's own relationships are not collected — the cascade already deletes them", () => {
  // Comment owns r1, which points at Post, not at Comment
  expect(inboundForModelDelete(project(), "a1", "m2")).toEqual([]);
});

test("deleting an app collects inbound relationships from other apps only", () => {
  // r2 lives in shop and points into blog; r1 lives in blog and dies with it
  expect(inboundForAppDelete(project(), "a1")).toEqual([{ modelId: "m3", relId: "r2" }]);
});

test("built-in targets are never collected for deletion", () => {
  const refs = [
    ...inboundForModelDelete(project(), "a1", "m1"),
    ...inboundForAppDelete(project(), "a1"),
  ];
  expect(refs.some((r) => r.relId === "r3")).toBe(false); // r3 -> auth.User
});

test("an unknown app or model collects nothing rather than throwing", () => {
  expect(inboundForModelDelete(project(), "a1", "nope")).toEqual([]);
  expect(inboundForAppDelete(project(), "nope")).toEqual([]);
});

test("removing the collected relationships leaves the project fully buildable", () => {
  const after = project();
  const inboundRefs = inboundForModelDelete(after, "a1", "m1");
  after.apps[0].models = after.apps[0].models.filter((m) => m.id !== "m1");
  for (const app of after.apps) {
    for (const m of app.models) {
      m.relationships = m.relationships.filter(
        (r) => !inboundRefs.some((ref) => ref.relId === r.id),
      );
    }
  }
  const core = buildCoreProject(after);
  // nothing was silently dropped: every surviving relationship still resolves
  expect(core.apps[1].models[0].relationships.map((r) => r.relatedTo())).toEqual(["auth.User"]);
});
