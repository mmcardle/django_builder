import { expect, test } from "vitest";
import { isValidName, nameError } from "./validate";

test("accepts names that are legal Python identifiers", () => {
  ["blog", "Post", "_private", "my_app2", "CamelCase"].forEach((n) =>
    expect(nameError(n)).toBeNull(),
  );
});

test("rejects an empty or whitespace-only name", () => {
  expect(nameError("", "App name")).toBe("App name is required");
  expect(nameError("   ", "App name")).toBe("App name is required");
});

test("rejects spaces, which would otherwise generate an unimportable package", () => {
  expect(nameError("my app", "App name")).toBe("App name can't contain spaces");
});

test("rejects a leading digit", () => {
  expect(nameError("2fast", "Model name")).toBe("Model name can't start with a number");
});

test("rejects punctuation and other non-identifier characters", () => {
  expect(nameError("my-app", "App name")).toBe(
    "App name can only use letters, numbers and underscores",
  );
  expect(nameError("app.name", "App name")).toBe(
    "App name can only use letters, numbers and underscores",
  );
});

test("rejects Python reserved words", () => {
  expect(nameError("class", "Model name")).toBe('"class" is a reserved Python word');
  expect(nameError("import")).toBe('"import" is a reserved Python word');
  // not reserved, just similar
  expect(nameError("classroom")).toBeNull();
});

test("trims before validating, so surrounding whitespace is not an error", () => {
  expect(nameError("  blog  ")).toBeNull();
});

test("isValidName mirrors nameError", () => {
  expect(isValidName("blog")).toBe(true);
  expect(isValidName("my app")).toBe(false);
});
