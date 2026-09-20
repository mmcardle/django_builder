/**
 * Read-only audit of the five Firestore collections for pre-2024 ("legacy")
 * storage formats and for data that today's readers would silently change:
 * field/relationship types the core registry no longer knows, targets or
 * parents that no longer resolve, and django_version values below 3.
 *
 * Pure: takes the already-fetched collections, returns a report. The CLI in
 * src/scripts/auditLegacyData.ts does the fetching.
 */
import { BuiltInModelTypes, FieldTypes, RelationshipTypes } from "@djangobuilder/core";
import { bareTypeName, normaliseTarget } from "./mapper";
import type { AppDoc, FieldDoc, FlatData, ModelDoc, ProjectDoc, RelationshipDoc } from "./types";

export type Collection = "projects" | "apps" | "models" | "fields" | "relationships";
type ChildCollection = Exclude<Collection, "projects">;

export interface AffectedProject {
  id: string;
  owner: string;
  name: string;
  /** Human-readable reasons the generated output or displayed version differs from what was built. */
  reasons: string[];
}

export interface AuditReport {
  totals: Record<Collection, number>;
  fieldTypes: { dottedKnown: number; unknown: Record<string, number>; missing: number };
  relationshipTypes: { dottedKnown: number; unknown: Record<string, number>; missing: number };
  relationshipTargets: { fullPath: number; unrecognised: Record<string, number> };
  parents: { djangoUnknown: Record<string, number>; userDangling: number };
  djangoVersions: Record<string, number>;
  preDjango3Projects: string[];
  integrity: {
    danglingRefs: number;
    orphans: Record<ChildCollection, number>;
    missingOwner: number;
    missingName: number;
    missingArgs: number;
  };
  /** Projects whose generated code or displayed Django version would differ from what the owner built. */
  affectedProjects: AffectedProject[];
  /** Projects that only carry pre-2024 dotted names, which readers normalise transparently. */
  legacyFormatProjects: string[];
}

const builtInModelNames = new Set(Object.values(BuiltInModelTypes).map((b) => b.model));
const USER_TARGET = /^[A-Za-z_]\w*\.[A-Za-z_]\w*$/;

function bump(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

export function auditFlatData(data: FlatData): AuditReport {
  const report: AuditReport = {
    totals: {
      projects: Object.keys(data.projects).length,
      apps: Object.keys(data.apps).length,
      models: Object.keys(data.models).length,
      fields: Object.keys(data.fields).length,
      relationships: Object.keys(data.relationships).length,
    },
    fieldTypes: { dottedKnown: 0, unknown: {}, missing: 0 },
    relationshipTypes: { dottedKnown: 0, unknown: {}, missing: 0 },
    relationshipTargets: { fullPath: 0, unrecognised: {} },
    parents: { djangoUnknown: {}, userDangling: 0 },
    djangoVersions: {},
    preDjango3Projects: [],
    integrity: {
      danglingRefs: 0,
      orphans: { apps: 0, models: 0, fields: 0, relationships: 0 },
      missingOwner: 0,
      missingName: 0,
      missingArgs: 0,
    },
    affectedProjects: [],
    legacyFormatProjects: [],
  };

  // Document-level checks, independent of reachability.
  const everyDoc: Array<ProjectDoc | AppDoc | ModelDoc | FieldDoc | RelationshipDoc> = [
    ...Object.values(data.projects),
    ...Object.values(data.apps),
    ...Object.values(data.models),
    ...Object.values(data.fields),
    ...Object.values(data.relationships),
  ];
  for (const doc of everyDoc) {
    if (!isNonEmptyString(doc.owner)) report.integrity.missingOwner++;
    if (!isNonEmptyString(doc.name)) report.integrity.missingName++;
  }
  for (const doc of [...Object.values(data.fields), ...Object.values(data.relationships)]) {
    if (typeof doc.args !== "string") report.integrity.missingArgs++;
  }

  // Orphans: children no parent map points at.
  const referenced: Record<ChildCollection, Set<string>> = {
    apps: new Set(Object.values(data.projects).flatMap((p) => Object.keys(p.apps ?? {}))),
    models: new Set(Object.values(data.apps).flatMap((a) => Object.keys(a.models ?? {}))),
    fields: new Set(Object.values(data.models).flatMap((m) => Object.keys(m.fields ?? {}))),
    relationships: new Set(Object.values(data.models).flatMap((m) => Object.keys(m.relationships ?? {}))),
  };
  for (const coll of Object.keys(referenced) as ChildCollection[]) {
    report.integrity.orphans[coll] = Object.keys(data[coll]).filter((id) => !referenced[coll].has(id)).length;
  }

  // Per-project walk: this is where "affected" reasons come from.
  for (const project of Object.values(data.projects)) {
    const reasons: string[] = [];
    let legacyFormat = false;

    const versionKey = String(project.django_version);
    bump(report.djangoVersions, versionKey);
    if (project.django_version === undefined || project.django_version === null) {
      reasons.push("django_version missing");
    } else if (!/^[3-6]/.test(versionKey)) {
      report.preDjango3Projects.push(project.id);
      reasons.push(`django_version ${versionKey} predates Django 3`);
    }

    const appIds = Object.keys(project.apps ?? {});
    const apps = appIds.map((id) => data.apps[id]).filter(Boolean);
    report.integrity.danglingRefs += appIds.length - apps.length;

    // "app.Model" names present in this project, for resolving relationship targets.
    const modelNames = new Set<string>();
    for (const app of apps) {
      for (const modelId of Object.keys(app.models ?? {})) {
        const model = data.models[modelId];
        if (model) modelNames.add(`${app.name}.${model.name}`);
      }
    }

    for (const app of apps) {
      const modelIds = Object.keys(app.models ?? {});
      const models = modelIds.map((id) => data.models[id]).filter(Boolean);
      report.integrity.danglingRefs += modelIds.length - models.length;

      for (const model of models) {
        for (const parent of model.parents ?? []) {
          if (parent.type === "django") {
            const base = bareTypeName(parent.class ?? "");
            if (!builtInModelNames.has(base)) {
              bump(report.parents.djangoUnknown, parent.class);
              reasons.push(`model "${model.name}" inherits from unknown base ${parent.class}`);
            }
          } else if (!data.apps[parent.app] || !data.models[parent.model]) {
            report.parents.userDangling++;
            reasons.push(`model "${model.name}" has a parent that no longer exists`);
          }
        }

        const fieldIds = Object.keys(model.fields ?? {});
        const fields = fieldIds.map((id) => data.fields[id]).filter(Boolean);
        report.integrity.danglingRefs += fieldIds.length - fields.length;
        for (const field of fields) {
          if (!isNonEmptyString(field.type)) {
            report.fieldTypes.missing++;
            reasons.push(`field "${field.name}" has no type`);
            continue;
          }
          const bare = bareTypeName(field.type);
          if (bare in FieldTypes) {
            if (bare !== field.type) {
              report.fieldTypes.dottedKnown++;
              legacyFormat = true;
            }
          } else {
            bump(report.fieldTypes.unknown, bare);
            reasons.push(`field "${field.name}" has unsupported type ${bare}`);
          }
        }

        const relIds = Object.keys(model.relationships ?? {});
        const rels = relIds.map((id) => data.relationships[id]).filter(Boolean);
        report.integrity.danglingRefs += relIds.length - rels.length;
        for (const rel of rels) {
          if (!isNonEmptyString(rel.type)) {
            report.relationshipTypes.missing++;
            reasons.push(`relationship "${rel.name}" has no type`);
          } else {
            const bare = bareTypeName(rel.type);
            if (bare in RelationshipTypes) {
              if (bare !== rel.type) {
                report.relationshipTypes.dottedKnown++;
                legacyFormat = true;
              }
            } else {
              bump(report.relationshipTypes.unknown, bare);
              reasons.push(`relationship "${rel.name}" has unsupported type ${bare}`);
            }
          }

          const to = typeof rel.to === "string" ? rel.to : "";
          const target = normaliseTarget(to);
          if (target !== to) {
            report.relationshipTargets.fullPath++;
            legacyFormat = true;
          } else if (!(to in BuiltInModelTypes)) {
            if (!USER_TARGET.test(to)) {
              bump(report.relationshipTargets.unrecognised, to || "(empty)");
              reasons.push(`relationship "${rel.name}" has unrecognised target ${to || "(empty)"}`);
            } else if (!modelNames.has(to)) {
              reasons.push(`relationship "${rel.name}" targets missing model ${to}`);
            }
          }
        }
      }
    }

    if (reasons.length > 0) {
      report.affectedProjects.push({ id: project.id, owner: project.owner, name: project.name, reasons });
    }
    if (legacyFormat) report.legacyFormatProjects.push(project.id);
  }

  return report;
}

/* ---------- Firestore REST document decoding ---------- */

export interface RawValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  timestampValue?: string;
  referenceValue?: string;
  mapValue?: { fields?: Record<string, RawValue> };
  arrayValue?: { values?: RawValue[] };
}
export interface RawDocument { name: string; fields?: Record<string, RawValue> }

export function decodeValue(v: RawValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("referenceValue" in v) return v.referenceValue;
  if ("mapValue" in v) return decodeFields(v.mapValue?.fields ?? {});
  if ("arrayValue" in v) return (v.arrayValue?.values ?? []).map(decodeValue);
  return undefined;
}

function decodeFields(fields: Record<string, RawValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
}

/** A REST document -> plain object with its id (the last path segment). */
export function decodeDocument(doc: RawDocument): Record<string, unknown> & { id: string } {
  return { ...decodeFields(doc.fields ?? {}), id: doc.name.split("/").pop() ?? doc.name };
}

/** Fetched REST documents per collection -> the id-keyed maps the audit reads. */
export function toFlatData(docs: Record<Collection, RawDocument[]>): FlatData {
  const byId = <T>(list: RawDocument[]) =>
    Object.fromEntries(list.map((d) => decodeDocument(d)).map((d) => [d.id, d as unknown as T])) as Record<string, T>;
  return {
    projects: byId<ProjectDoc>(docs.projects),
    apps: byId<AppDoc>(docs.apps),
    models: byId<ModelDoc>(docs.models),
    fields: byId<FieldDoc>(docs.fields),
    relationships: byId<RelationshipDoc>(docs.relationships),
  };
}

/* ---------- Plain-text summary ---------- */

function counts(c: Record<string, number>): string {
  const entries = Object.entries(c);
  return entries.length ? entries.map(([k, n]) => `${k}: ${n}`).join(", ") : "none";
}

export function formatReport(r: AuditReport): string {
  const t = r.totals;
  const o = r.integrity.orphans;
  const lines = [
    "Legacy data audit",
    `  documents            projects: ${t.projects}  apps: ${t.apps}  models: ${t.models}  fields: ${t.fields}  relationships: ${t.relationships}`,
    `  field types          dotted-but-known: ${r.fieldTypes.dottedKnown}  missing: ${r.fieldTypes.missing}  unsupported: ${counts(r.fieldTypes.unknown)}`,
    `  relationship types   dotted-but-known: ${r.relationshipTypes.dottedKnown}  missing: ${r.relationshipTypes.missing}  unsupported: ${counts(r.relationshipTypes.unknown)}`,
    `  relationship targets full-path built-ins: ${r.relationshipTargets.fullPath}  unrecognised: ${counts(r.relationshipTargets.unrecognised)}`,
    `  parents              unknown django bases: ${counts(r.parents.djangoUnknown)}  dangling user parents: ${r.parents.userDangling}`,
    `  django_version       ${counts(r.djangoVersions)}  pre-Django-3 projects: ${r.preDjango3Projects.join(", ") || "none"}`,
    `  integrity            dangling refs: ${r.integrity.danglingRefs}  orphans: apps ${o.apps} / models ${o.models} / fields ${o.fields} / relationships ${o.relationships}  missing owner: ${r.integrity.missingOwner}  missing name: ${r.integrity.missingName}  missing args: ${r.integrity.missingArgs}`,
    `  legacy-format-only projects (normalised on read): ${r.legacyFormatProjects.length}`,
    `  affected projects (output or version would differ): ${r.affectedProjects.length}`,
    ...r.affectedProjects.map((p) => `    ${p.id}  owner ${p.owner}  "${p.name}": ${p.reasons.join("; ")}`),
  ];
  return lines.join("\n");
}
