import { FieldTypes, RelationshipTypes, BuiltInModelTypes, ParentModelTypes } from "@djangobuilder/core";

export const fieldTypeNames: string[] = Object.keys(FieldTypes).sort();
export const relationshipTypeNames: string[] = Object.keys(RelationshipTypes);

/** Django built-in models usable as relationship targets (auth.User,
 * auth.AbstractUser, auth.AbstractBaseUser, auth.Group). Derived from core. */
export const builtInTargets: string[] = Object.keys(BuiltInModelTypes);

/** Django built-in models usable as model PARENTS (auth.User, auth.AbstractUser). */
export const builtInParentTargets: string[] = Object.keys(ParentModelTypes);

/** Full import path for a built-in target (auth.User -> django.contrib.auth.models.User). */
export function builtInClass(name: string): string | null {
  const b = BuiltInModelTypes[name as keyof typeof BuiltInModelTypes];
  return b ? b.fullPath : null;
}

/** Valid relationship targets for a project: the built-in models plus every user model. */
export function relationshipTargets(
  apps: { name: string; models: { name: string }[] }[],
): string[] {
  const userModels = apps.flatMap((a) => a.models.map((m) => `${a.name}.${m.name}`));
  return [...builtInTargets, ...userModels];
}
