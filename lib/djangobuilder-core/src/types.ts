interface IDjangoRelationship {
  name: string;
  type: string;
  to: string;
  args: string;
}

interface IDjangoField {
  name: string;
  type: string;
  args: string;
}

interface IDjangoModel {
  fields: Array<IDjangoField>;
  relationships: Array<IDjangoRelationship>;
}

interface IDjangoApp {
  name: string;
  models: Array<IDjangoModel>;
}

enum DjangoVersion {
  DJANGO3 = 3.2,
  DJANGO4 = 4.1,
}

interface IDjangoProject {
  name: string;
  description: string;
  version: DjangoVersion;
  channels: boolean;
  htmx: boolean;
  apps: Array<IDjangoApp>;
  middlewares: Array<String>;
}


export { IDjangoProject , IDjangoApp, IDjangoModel , IDjangoField, IDjangoRelationship, DjangoVersion }