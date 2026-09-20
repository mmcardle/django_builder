import { describe, expect, test } from "vitest";
import type { FlatData } from "./types";
import { auditFlatData, decodeDocument, formatReport } from "./audit";

/** Three projects: p1 mixes modern and pre-2024 formats, p2 predates Django 3, p3 has a broken field. */
function fixture(): FlatData {
  return {
    projects: {
      p1: { id: "p1", owner: "u1", name: "Shop", description: "", channels: false, htmx: false, django_version: 5.1, apps: { a1: true, ghost: true } },
      p2: { id: "p2", owner: "u2", name: "Ancient", description: "", channels: false, htmx: false, django_version: "2.2", apps: {} },
      p3: { id: "p3", owner: "u1", name: "Broken", description: "", channels: false, htmx: false, django_version: 4.1, apps: { a2: true } },
    },
    apps: {
      a1: { id: "a1", owner: "u1", name: "shop", models: { m1: true } },
      a2: { id: "a2", owner: "u1", name: "misc", models: { m2: true } },
    },
    models: {
      m1: {
        id: "m1", owner: "u1", name: "Order", abstract: false,
        parents: [
          { type: "django", class: "django.contrib.auth.models.AbstractUser" },
          { type: "user", app: "aX", model: "mX" },
        ],
        fields: { f1: true, f2: true, f3: true }, relationships: { r1: true, r2: true },
      },
      m2: { id: "m2", owner: "u1", name: "Thing", abstract: false, fields: { f4: true }, relationships: {} },
    },
    fields: {
      f1: { id: "f1", owner: "u1", name: "ref", type: "CharField", args: "max_length=30" },
      f2: { id: "f2", owner: "u1", name: "created", type: "django.db.models.DateTimeField", args: "auto_now_add=True" },
      f3: { id: "f3", owner: "u1", name: "ints", type: "django.db.models.CommaSeparatedIntegerField", args: "" },
      f4: { id: "f4", owner: "u1", name: "notype", type: undefined as unknown as string, args: undefined as unknown as string },
      f9: { id: "f9", owner: "u1", name: "orphan", type: "CharField", args: "" },
    },
    relationships: {
      r1: { id: "r1", owner: "u1", name: "customer", type: "django.db.models.ForeignKey", to: "django.contrib.auth.models.User", args: "" },
      r2: { id: "r2", owner: "u1", name: "parent", type: "ForeignKey", to: "shop.Order", args: "" },
    },
  };
}

describe("auditFlatData", () => {
  const report = auditFlatData(fixture());

  test("counts every document", () => {
    expect(report.totals).toEqual({ projects: 3, apps: 2, models: 2, fields: 5, relationships: 2 });
  });

  test("separates dotted-but-known field types from unknown and missing ones", () => {
    expect(report.fieldTypes.dottedKnown).toBe(1);
    expect(report.fieldTypes.unknown).toEqual({ CommaSeparatedIntegerField: 1 });
    expect(report.fieldTypes.missing).toBe(1);
  });

  test("classifies relationship types and targets", () => {
    expect(report.relationshipTypes.dottedKnown).toBe(1);
    expect(report.relationshipTypes.unknown).toEqual({});
    expect(report.relationshipTargets.fullPath).toBe(1);
    expect(report.relationshipTargets.unrecognised).toEqual({});
  });

  test("checks parents", () => {
    expect(report.parents.djangoUnknown).toEqual({});
    expect(report.parents.userDangling).toBe(1);
  });

  test("reports the django_version distribution and pre-Django-3 projects", () => {
    expect(report.djangoVersions).toEqual({ "5.1": 1, "2.2": 1, "4.1": 1 });
    expect(report.preDjango3Projects).toEqual(["p2"]);
  });

  test("reports integrity problems", () => {
    expect(report.integrity.danglingRefs).toBe(1); // p1.apps.ghost
    expect(report.integrity.orphans).toEqual({ apps: 0, models: 0, fields: 1, relationships: 0 });
    expect(report.integrity.missingArgs).toBe(1);
    expect(report.integrity.missingOwner).toBe(0);
  });

  test("lists projects whose generated output would change, with reasons, and the legacy-format-only ones", () => {
    expect(report.affectedProjects.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    const p1 = report.affectedProjects.find((p) => p.id === "p1")!;
    expect(p1.owner).toBe("u1");
    expect(p1.reasons).toEqual([
      'model "Order" has a parent that no longer exists',
      'field "ints" has unsupported type CommaSeparatedIntegerField',
    ]);
    expect(report.affectedProjects.find((p) => p.id === "p2")!.reasons).toEqual(["django_version 2.2 predates Django 3"]);
    expect(report.affectedProjects.find((p) => p.id === "p3")!.reasons).toEqual(['field "notype" has no type']);
    expect(report.legacyFormatProjects).toEqual(["p1"]);
  });
});

test("decodeDocument converts a Firestore REST document into a plain object with its id", () => {
  const doc = {
    name: "projects/x/databases/(default)/documents/projects/abc",
    fields: {
      owner: { stringValue: "u" },
      django_version: { doubleValue: 3.2 },
      apps: { mapValue: { fields: { a1: { booleanValue: true } } } },
      parents: { arrayValue: { values: [{ mapValue: { fields: { type: { stringValue: "django" }, class: { stringValue: "a.B" } } } }] } },
      n: { integerValue: "3" },
      z: { nullValue: null },
    },
  };
  expect(decodeDocument(doc)).toEqual({
    id: "abc", owner: "u", django_version: 3.2, apps: { a1: true }, parents: [{ type: "django", class: "a.B" }], n: 3, z: null,
  });
});

test("formatReport renders a readable summary", () => {
  const text = formatReport(auditFlatData(fixture()));
  expect(text).toContain("fields: 5");
  expect(text).toContain("CommaSeparatedIntegerField: 1");
  expect(text).toContain("p2");
});
