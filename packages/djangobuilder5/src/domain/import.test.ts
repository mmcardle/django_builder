import { expect, test } from "vitest";
import { parseModelsPy } from "./import";

const SAMPLE = `
from django.db import models

class Post(models.Model):
    title = models.CharField()
    body = models.TextField()
    author = models.ForeignKey(auth.User)

    class Meta:
        abstract = True
`;

test("parses models, fields and their types from pasted models.py", () => {
  const { models } = parseModelsPy(SAMPLE);
  const post = models.find((m) => m.name === "Post")!;
  expect(post).toBeTruthy();
  expect(post.abstract).toBe(true);
  expect(post.fields.map((f) => f.name)).toEqual(expect.arrayContaining(["title", "body"]));
  expect(post.fields.find((f) => f.name === "title")?.type).toBe("CharField");
});

test("keeps relationships to built-in targets", () => {
  const { models } = parseModelsPy(SAMPLE);
  const post = models.find((m) => m.name === "Post")!;
  const author = post.relationships.find((r) => r.name === "author");
  expect(author?.to).toBe("auth.User");
  expect(author?.type).toBe("ForeignKey");
});

test("returns an errors array (never throws) for unparseable input", () => {
  const { models, errors } = parseModelsPy("this is not python");
  expect(Array.isArray(models)).toBe(true);
  expect(Array.isArray(errors)).toBe(true);
});
