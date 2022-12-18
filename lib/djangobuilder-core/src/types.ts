interface IBuiltInModel {
  name: string;
  model: string;
}

type IRelatedField = IDjangoModel | IBuiltInModel;

interface IFieldType {
  name: string
  is_postgres: boolean
  is_postgres_range: boolean
}

interface IRelationshipType {
  name: string
}

type IFieldTestDefault = Array<number| string> | number | string;

interface IDjangoField {
  model: IDjangoModel;
  name: string;
  type: IFieldType;
  args: string;
}

interface IDjangoRelationship {
  model: IDjangoModel;
  name: string;
  type: IRelationshipType;
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
  addField(name: string, type: IFieldType, args: string, editable: boolean ): IDjangoField;
  addRelationship(name: string, type: IDjangoRelationship, to: IDjangoModel | IBuiltInModel, args: string): IDjangoRelationship;
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
  postgres: boolean;
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
  IFieldType,
  IFieldTestDefault,
  IRelationshipType
}