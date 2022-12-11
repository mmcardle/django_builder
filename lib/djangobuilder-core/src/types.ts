
interface IBuiltInModel {
  name: string;
  model: string;
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
  to: IDjangoModel | IBuiltInModel;
  args: string;
}

interface IDjangoModel {
  app: IDjangoApp;
  name: string;
  abstract: boolean;
  primaryKey: string;
  nameField: string;
  relatedName: string;
  parents: Array<IDjangoModel>;
  fields: Array<IDjangoField>;
  relationships: Array<IDjangoRelationship>;
  addField(name: string, type: string, args: string): IDjangoField;
  addRelationship(name: string, type: string, to: IDjangoModel | IBuiltInModel, args: string): IDjangoRelationship;
  setNameField(fieldName: string): void;
}

interface IDjangoApp {
  project: IDjangoProject;
  name: string;
  models: Array<IDjangoModel>;
  addModel(name: string, abstract?: boolean): IDjangoModel;
  get concreteModels(): IDjangoModel[];
}

enum DjangoVersion {
  DJANGO2 = 2.2,
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
  IBuiltInModel,
}