
interface IBuiltInModel {
  name: string;
}

type IRelatedField = IDjangoModel | IBuiltInModel;

interface IDjangoField {
  model: IDjangoModel;
  name: string;
  type: string;
  args: string;
}

interface IDjangoRelationship {
  model: IDjangoModel;
  name: string;
  type: string;
  to: string;
  args: string;
}

interface IDjangoModel {
  name: string;
  fields: Array<IDjangoField>;
  relationships: Array<IDjangoRelationship>;
}

interface IDjangoApp {
  project: IDjangoProject;
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
  middlewares: Array<string>;
}


export {
  IDjangoProject,
  IDjangoApp,
  IDjangoModel,
  IDjangoField,
  IDjangoRelationship,
  DjangoVersion,
  IRelatedField,
  IBuiltInModel
}