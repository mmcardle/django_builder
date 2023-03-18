type Project = {
  id: string;
  name: string;
  description: string;
  owner: string;
  channels: boolean;
  htmx: boolean;
  apps: Record<string, boolean>;
  django_version: number | string;
};

type App = {
  id: string;
  owner: string;
  name: string;
  models: Record<string, boolean>;
};

type Model = {
  id: string;
  owner: string;
  name: string;
  abstract: boolean;
  parents: Array<string>;
  relationships: Record<string, boolean>;
  fields: Record<string, boolean>;
};

type Field = {
  id: string;
  owner: string;
  name: string;
  type: string;
  args: string;
};

type Relationship = {
  id: string;
  owner: string;
  name: string;
  type: string;
  to: string;
  args: string;
};

export type { Project, App, Model, Field, Relationship };
