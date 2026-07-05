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

export interface LocalModel {
  id: string;
  name: string;
  abstract: boolean;
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
  djangoVersion: 3 | 4 | 5;
  channels: boolean;
  htmx: boolean;
  postgres: boolean;
  apps: LocalApp[];
}
