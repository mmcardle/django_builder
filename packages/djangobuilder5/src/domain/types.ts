export type RelationshipTypeName = "ForeignKey" | "OneToOneField" | "ManyToManyField";

export interface LocalField {
  id: string;
  name: string;
  type: string; // key of FieldTypes, e.g. "CharField"
  args: string;
}

export interface LocalRelationship {
  id: string;
  name: string;
  type: RelationshipTypeName;
  to: string; // "auth.User" or "<appName>.<ModelName>"
  args: string;
}

/** A model's superclass: a Django built-in base, or another user model.
 * Matches the Firestore `models.parents` format shared with djangobuilder.io. */
export type LocalParent =
  | { type: "django"; class: string }
  | { type: "user"; app: string; model: string };

export interface LocalModel {
  id: string;
  name: string;
  abstract: boolean;
  parents: LocalParent[];
  fields: LocalField[];
  relationships: LocalRelationship[];
}

export interface LocalApp {
  id: string;
  name: string;
  models: LocalModel[];
}

export interface LocalProject {
  id: string;
  name: string;
  description: string;
  djangoVersion: 3 | 4 | 5 | 6;
  channels: boolean;
  htmx: boolean;
  apps: LocalApp[];
}
