import { FieldTypes, RelationshipTypes } from "@djangobuilder/core";

export const fieldTypeNames: string[] = Object.keys(FieldTypes).sort();
export const relationshipTypeNames: string[] = Object.keys(RelationshipTypes);

/** Valid relationship targets for a project: auth.User plus every user model. */
export function relationshipTargets(
  apps: { name: string; models: { name: string }[] }[],
): string[] {
  const userModels = apps.flatMap((a) => a.models.map((m) => `${a.name}.${m.name}`));
  return ["auth.User", ...userModels];
}
