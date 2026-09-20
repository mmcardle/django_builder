import { expect, test } from "vitest";
import type { FlatData } from "./types";
import { renestProject, projectSummary } from "./mapper";

function fixture(): FlatData {
  return {
    projects: {
      p1: { id: "p1", owner: "u", name: "Blog", description: "d", channels: false, htmx: true, django_version: 5.1, apps: { a1: true } },
    },
    apps: { a1: { id: "a1", owner: "u", name: "blog", models: { m1: true, m2: true } } },
    models: {
      m1: { id: "m1", owner: "u", name: "Post", abstract: false, fields: { f1: true }, relationships: { r1: true } },
      m2: { id: "m2", owner: "u", name: "Comment", abstract: false, fields: {}, relationships: {} },
    },
    fields: { f1: { id: "f1", owner: "u", name: "title", type: "CharField", args: "max_length=200" } },
    relationships: { r1: { id: "r1", owner: "u", name: "author", type: "ForeignKey", to: "auth.User", args: "" } },
  };
}

test("renestProject builds a LocalProject from the flat maps", () => {
  const p = renestProject(fixture(), "p1")!;
  expect(p.id).toBe("p1");
  expect(p.name).toBe("Blog");
  expect(p.djangoVersion).toBe(5); // 5.1 -> 5
  expect(p.htmx).toBe(true);
  expect(p.apps.map((a) => a.name)).toEqual(["blog"]);
  const models = p.apps[0].models;
  expect(models.map((m) => m.name)).toEqual(["Post", "Comment"]);
  expect(models[0].fields).toEqual([{ id: "f1", name: "title", type: "CharField", args: "max_length=200" }]);
  expect(models[0].relationships[0]).toMatchObject({ name: "author", type: "ForeignKey", to: "auth.User" });
});

test("renestProject returns null for an unknown project id", () => {
  expect(renestProject(fixture(), "nope")).toBeNull();
});

test("renestProject skips dangling child ids without throwing", () => {
  const data = fixture();
  data.apps.a1.models.ghost = true; // pointer to a missing model
  const p = renestProject(data, "p1")!;
  expect(p.apps[0].models.map((m) => m.name)).toEqual(["Post", "Comment"]);
});

test("projectSummary reports counts and version", () => {
  const s = projectSummary(fixture(), "p1")!;
  expect(s).toMatchObject({ id: "p1", name: "Blog", djangoVersion: 5, appCount: 1, modelCount: 2, htmx: true });
});

test("renestProject normalises legacy dotted type names and built-in targets", () => {
  // Projects created before the Dec-2024 core refactor stored fully-qualified
  // Django paths; the registry is keyed by bare class name.
  const data = fixture();
  data.fields.f1.type = "django.db.models.DateTimeField";
  data.relationships.r1.type = "django.db.models.ForeignKey";
  data.relationships.r1.to = "django.contrib.auth.models.User";
  data.relationships.r2 = { id: "r2", owner: "u", name: "post", type: "ForeignKey", to: "blog.Post", args: "" };
  data.models.m1.relationships.r2 = true;

  const post = renestProject(data, "p1")!.apps[0].models[0];
  expect(post.fields[0].type).toBe("DateTimeField");
  expect(post.relationships[0]).toMatchObject({ type: "ForeignKey", to: "auth.User" });
  // Modern values pass through untouched, including user-model targets that contain a dot.
  expect(post.relationships[1]).toMatchObject({ type: "ForeignKey", to: "blog.Post" });
});
