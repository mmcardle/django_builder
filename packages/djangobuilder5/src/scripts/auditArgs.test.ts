import { expect, test } from "vitest";
import { parseAuditArgs } from "./auditArgs";

test("a bare environment argument is the target", () => {
  expect(parseAuditArgs(["development"])).toEqual({ target: "development", outFile: undefined, full: false });
});

test("--out takes the next argument and the target can come either side of it", () => {
  expect(parseAuditArgs(["production", "--out", "report.json"])).toEqual({ target: "production", outFile: "report.json", full: false });
  expect(parseAuditArgs(["--out", "report.json", "staging"])).toEqual({ target: "staging", outFile: "report.json", full: false });
});

test("no arguments means no target", () => {
  expect(parseAuditArgs([])).toEqual({ target: undefined, outFile: undefined, full: false });
  expect(parseAuditArgs(["--out", "x.json"])).toEqual({ target: undefined, outFile: "x.json", full: false });
});

test("--full opts into the per-document scan", () => {
  expect(parseAuditArgs(["production", "--full"])).toEqual({ target: "production", outFile: undefined, full: true });
});
