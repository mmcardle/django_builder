import { expect, test } from "vitest";
import { highlight, langForFile } from "./highlight";

test("langForFile maps extensions", () => {
  expect(langForFile("models.py")).toBe("python");
  expect(langForFile("base.html")).toBe("django");
  expect(langForFile("Makefile")).toBe("plaintext");
});

test("highlight wraps python keywords in hljs spans", () => {
  const html = highlight("class Post:\n    pass", "python");
  expect(html).toContain('class="hljs-keyword"');
});

test("highlight escapes plaintext without throwing", () => {
  expect(highlight("a < b && c", "plaintext")).toContain("&lt;");
});
