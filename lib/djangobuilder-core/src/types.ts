
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
  app: IDjangoApp;
  name: string;
  abstract: boolean;
  primaryKey: string;
  relatedName: string
  fields: Array<IDjangoField>;
  relationships: Array<IDjangoRelationship>;
  addField(name: string, type: string, args: string): IDjangoField;
  addRelationship(name: string, type: string, to: IDjangoModel | IBuiltInModel, args: string): IDjangoRelationship;
}

interface IDjangoApp {
  project: IDjangoProject;
  name: string;
  models: Array<IDjangoModel>;
  addModel(name: string, abstract?: boolean): IDjangoModel;
  get concreteModels(): IDjangoModel[];
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
  addApp(name: string): IDjangoApp;
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