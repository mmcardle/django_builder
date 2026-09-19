import { expect, test } from "vitest";
import { Renderer } from "@djangobuilder/core";
import { buildCoreProject } from "./buildCoreProject";
import { makeSeedProject } from "./seed";
import type { LocalProject } from "./types";

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

test("maps djangoVersion 6 to the core Django-6 version", () => {
  const core = buildCoreProject({ ...makeSeedProject(), djangoVersion: 6 });
  expect(core.version).toBe(6.0); // === 6 in JS
  const reqs = new Renderer().renderProjectFile("requirements.txt", core);
  expect(reqs).toContain("Django==6"); // numeric enum drops the trailing .0
});

test("resolves a relationship targeting another user model", () => {
  const core = buildCoreProject(makeSeedProject());
  const comment = core.apps[0].models[1];
  expect(comment.relationships[0].relatedTo()).toContain("Post");
});

test("resolves django built-in and user-model parents", () => {
  const project: LocalProject = {
    id: "p", name: "P", description: "", djangoVersion: 5, channels: false, htmx: false,
    apps: [
      {
        id: "a", name: "blog",
        models: [
          { id: "base", name: "Base", abstract: true, parents: [], fields: [], relationships: [] },
          {
            id: "post", name: "Post", abstract: false,
            parents: [
              { type: "django", class: "django.contrib.auth.models.AbstractUser" },
              { type: "user", app: "a", model: "base" },
            ],
            fields: [], relationships: [],
          },
        ],
      },
    ],
  };
  const core = buildCoreProject(project);
  const post = core.apps[0].models.find((m) => m.name === "Post")!;
  const names = (post.parents as Array<{ model?: string; name?: string }>).map((p) => p.model ?? p.name);
  expect(names).toContain("AbstractUser"); // built-in base
  expect(names).toContain("Base"); // user-model base
});

test("resolves a relationship to a built-in base like auth.Group", () => {
  const project: LocalProject = {
    id: "p", name: "P", description: "", djangoVersion: 5, channels: false, htmx: false,
    apps: [
      {
        id: "a", name: "blog",
        models: [
          {
            id: "m", name: "Post", abstract: false, parents: [], fields: [],
            relationships: [{ id: "r", name: "groups", type: "ManyToManyField", to: "auth.Group", args: "" }],
          },
        ],
      },
    ],
  };
  const core = buildCoreProject(project);
  expect(core.apps[0].models[0].relationships[0].relatedTo()).toContain("Group");
});

test("wires a relationship onto its own model even when two models share a name", () => {
  // Regression: pass 2 must use the model built in pass 1 by identity, not a
  // name re-lookup (which would attach the relationship to the first "Dup").
  const project: LocalProject = {
    id: "p",
    name: "P",
    description: "",
    djangoVersion: 5,
    channels: false,
    htmx: false,
    apps: [
      {
        id: "a",
        name: "blog",
        models: [
          { id: "m1", name: "Dup", abstract: false, parents: [], fields: [], relationships: [] },
          {
            id: "m2",
            name: "Dup",
            abstract: false,
            parents: [],
            fields: [],
            relationships: [
              { id: "r1", name: "owner", type: "ForeignKey", to: "auth.User", args: "on_delete=models.CASCADE" },
            ],
          },
        ],
      },
    ],
  };
  const models = buildCoreProject(project).apps[0].models;
  expect(models[0].relationships).toHaveLength(0);
  expect(models[1].relationships.map((r) => r.name)).toEqual(["owner"]);
});
