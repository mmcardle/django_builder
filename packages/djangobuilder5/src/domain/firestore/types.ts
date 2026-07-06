export interface ProjectDoc {
  id: string;
  owner: string;
  name: string;
  description: string;
  channels: boolean;
  htmx: boolean;
  django_version: number | string;
  apps: Record<string, boolean>;
}
export interface AppDoc {
  id: string;
  owner: string;
  name: string;
  models: Record<string, boolean>;
}
export interface DjangoParent { type: "django"; class: string }
export interface UserParent { type: "user"; app: string; model: string }
export type ParentDoc = DjangoParent | UserParent;
export interface ModelDoc {
  id: string;
  owner: string;
  name: string;
  abstract: boolean;
  parents?: ParentDoc[];
  fields: Record<string, boolean>;
  relationships: Record<string, boolean>;
}
export interface FieldDoc { id: string; owner: string; name: string; type: string; args: string }
export interface RelationshipDoc { id: string; owner: string; name: string; type: string; to: string; args: string }

/** All five collections as id-keyed maps (what a subscription accumulates). */
export interface FlatData {
  projects: Record<string, ProjectDoc>;
  apps: Record<string, AppDoc>;
  models: Record<string, ModelDoc>;
  fields: Record<string, FieldDoc>;
  relationships: Record<string, RelationshipDoc>;
}

export function emptyFlatData(): FlatData {
  return { projects: {}, apps: {}, models: {}, fields: {}, relationships: {} };
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  djangoVersion: 3 | 4 | 5;
  channels: boolean;
  htmx: boolean;
  appCount: number;
  modelCount: number;
}
