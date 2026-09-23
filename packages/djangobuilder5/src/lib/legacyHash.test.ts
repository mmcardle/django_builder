import { describe, expect, test, vi } from "vitest";
import { legacyHashToPath, redirectLegacyHash } from "./legacyHash";

describe("legacyHashToPath", () => {
  test.each([
    ["#/project/abc123", "/project/abc123"],
    ["#/project/abc123/", "/project/abc123"],
    ["#/home", "/projects"],
    ["#/login", "/login"],
    ["#/login/", "/login"],
    ["#/signup", "/signup"],
    ["#/about", "/about"],
    ["#/unverified", "/unverified"],
    ["#/reset_password", "/reset"],
    ["#/action?mode=verifyEmail&oobCode=XYZ", "/action?mode=verifyEmail&oobCode=XYZ"],
    ["#/verify/XYZ", "/action?mode=verifyEmail&oobCode=XYZ"],
    ["#/reset/XYZ", "/action?mode=resetPassword&oobCode=XYZ"],
    ["#/", "/"],
    ["#/error", "/"],
    ["#/debug", "/"],
    ["#/something/else", "/"],
  ])("maps %s to %s", (hash, expected) => {
    expect(legacyHashToPath(hash)).toBe(expected);
  });

  test.each([[""], ["#"], ["#section"], ["#foo/bar"]])("returns null for %j", (hash) => {
    expect(legacyHashToPath(hash)).toBeNull();
  });
});

describe("redirectLegacyHash", () => {
  test("rewrites a legacy hash URL in place at the app base", () => {
    const history = { replaceState: vi.fn() };
    const result = redirectLegacyHash({ pathname: "/", hash: "#/project/abc" }, history, "/");
    expect(result).toBe("/project/abc");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/project/abc");
  });

  test("prefixes a non-root base", () => {
    const history = { replaceState: vi.fn() };
    expect(redirectLegacyHash({ pathname: "/db5/", hash: "#/login/" }, history, "/db5/")).toBe("/db5/login");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/db5/login");
  });

  test("does nothing off the base path or without a legacy hash", () => {
    const history = { replaceState: vi.fn() };
    expect(redirectLegacyHash({ pathname: "/about", hash: "#/login" }, history, "/")).toBeNull();
    expect(redirectLegacyHash({ pathname: "/", hash: "" }, history, "/")).toBeNull();
    expect(history.replaceState).not.toHaveBeenCalled();
  });
});
