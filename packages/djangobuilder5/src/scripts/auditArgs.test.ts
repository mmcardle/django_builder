import { expect, test } from "vitest";
import { parseAuditArgs } from "./auditArgs";

test("a bare environment argument is the target", () => {
  expect(parseAuditArgs(["development"])).toEqual({ target: "development", outFile: undefined });
});

test("--out takes the next argument and the target can come either side of it", () => {
  expect(parseAuditArgs(["production", "--out", "report.json"])).toEqual({ target: "production", outFile: "report.json" });
  expect(parseAuditArgs(["--out", "report.json", "staging"])).toEqual({ target: "staging", outFile: "report.json" });
});

test("no arguments means no target", () => {
  expect(parseAuditArgs([])).toEqual({ target: undefined, outFile: undefined });
  expect(parseAuditArgs(["--out", "x.json"])).toEqual({ target: undefined, outFile: "x.json" });
});
