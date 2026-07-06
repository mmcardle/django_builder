import { expect, test } from "vitest";
import { toVersionNumber, fromVersion } from "./version";

test("toVersionNumber maps 3|4|5 to the Django enum numbers", () => {
  expect(toVersionNumber(3)).toBe(3.2);
  expect(toVersionNumber(4)).toBe(4.1);
  expect(toVersionNumber(5)).toBe(5.1);
});

test("fromVersion tolerates number or string and returns 3|4|5", () => {
  expect(fromVersion(3.2)).toBe(3);
  expect(fromVersion("4.1")).toBe(4);
  expect(fromVersion(5.1)).toBe(5);
  expect(fromVersion("5")).toBe(5);
  expect(fromVersion(undefined as unknown as number)).toBe(5); // default
});
