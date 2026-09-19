import { ModelImporter, FieldTypes, RelationshipTypes } from "@djangobuilder/core";
import { builtInTargets } from "./options";

export interface ParsedField {
  name: string;
  type: string;
  args: string;
}
export interface ParsedRelationship {
  name: string;
  type: string;
  to: string;
  args: string;
}
export interface ParsedModel {
  name: string;
  abstract: boolean;
  fields: ParsedField[];
  relationships: ParsedRelationship[];
}
export interface ParseResult {
  models: ParsedModel[];
  errors: string[];
}

function fieldTypeKey(type: unknown): string {
  return (
    Object.keys(FieldTypes).find((k) => FieldTypes[k as keyof typeof FieldTypes] === type) ??
    "CharField"
  );
}
function relTypeKey(type: unknown): string {
  return (
    Object.keys(RelationshipTypes).find(
      (k) => RelationshipTypes[k as keyof typeof RelationshipTypes] === type,
    ) ?? "ForeignKey"
  );
}

/** Parse pasted `models.py` text into plain, addable models via the core
 * ModelImporter. Relationships whose target can't be resolved to a built-in
 * base are dropped and reported as errors (they must be re-added by hand). */
export function parseModelsPy(text: string): ParseResult {
  const [result] = new ModelImporter().import_models([text]);
  const errors: string[] = [...(result?.errors ?? [])];
  const models: ParsedModel[] = (result?.models ?? []).map((m) => {
    const relationships: ParsedRelationship[] = [];
    for (const r of m.relationships) {
      const to = r.relatedTo();
      if (builtInTargets.includes(to)) {
        relationships.push({ name: r.name, type: relTypeKey(r.type), to, args: r.args ?? "" });
      } else {
        errors.push(`${m.name}.${r.name}: couldn't resolve target "${to}" — add it by hand`);
      }
    }
    return {
      name: m.name,
      abstract: Boolean(m.abstract),
      fields: m.fields.map((f) => ({ name: f.name, type: fieldTypeKey(f.type), args: f.args ?? "" })),
      relationships,
    };
  });
  return { models, errors };
}
