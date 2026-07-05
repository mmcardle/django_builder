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
  expect(comment.relationships[0].relatedTo()).toContain("Post");
});
