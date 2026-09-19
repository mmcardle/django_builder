import { expect, test } from "vitest";
import { builtInTargets, relationshipTargets } from "./options";

test("builtInTargets includes the four Django built-in models", () => {
  expect(builtInTargets).toEqual(
    expect.arrayContaining(["auth.User", "auth.AbstractUser", "auth.AbstractBaseUser", "auth.Group"]),
  );
});

test("relationshipTargets lists the built-ins before user models", () => {
  const targets = relationshipTargets([{ name: "blog", models: [{ name: "Post" }] }]);
  expect(targets).toContain("auth.Group");
  expect(targets).toContain("blog.Post");
  expect(targets.indexOf("auth.User")).toBeLessThan(targets.indexOf("blog.Post"));
});
