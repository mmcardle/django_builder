interface Identifiable {
  id : string;
}

interface IBuiltInModel {
  name: string;
  model: string;
}

type IRelatedField = IDjangoModel | IBuiltInModel;
type IParentField = IDjangoModel | IBuiltInModel;

interface IFieldType {
  name: string
  is_postgres: boolean
  is_postgres_range: boolean
}

interface IRelationshipType {
  name: string
}

type IFieldTestDefault = Array<number| string> | number | string;

interface IDjangoField extends Identifiable {
  model: IDjangoModel;
  name: string;
  type: IFieldType;
  args: string;
}

interface IDjangoRelationship extends Identifiable {
  model: IDjangoModel;
  name: string;
  type: IRelationshipType;
  to: IRelatedField;
  args: string;
  relatedTo(): string;
}

interface IDjangoModel extends Identifiable {
  app: IDjangoApp;
  name: string;
  abstract: boolean;
  primaryKey: string;
  nameField: string;
  relatedName: string;
  parents: Array<IParentField>;
  fields: Array<IDjangoField>;
  relationships: Array<IDjangoRelationship>;
  addField(name: string, type: IFieldType, args: string, editable: boolean ): IDjangoField;
  addRelationship(name: string, type: IRelationshipType, to: IRelatedField, args: string): IDjangoRelationship;
  setNameField(fieldName: string): void;
}

interface IDjangoApp extends Identifiable {
  project: IDjangoProject;
  name: string;
  models: Array<IDjangoModel>;
  addModel(name: string, abstract?: boolean): IDjangoModel;
  get concreteModels(): IDjangoModel[];
}

enum DjangoVersion {
  DJANGO3 = 3.2,
  DJANGO4 = 4.1,
  DJANGO5 = 5.1,
}

interface IDjangoProject extends Identifiable {
  name: string;
  description: string;
  version: DjangoVersion;
  channels: boolean;
  htmx: boolean;
  postgres: boolean;
  pillow: boolean;
  apps: Array<IDjangoApp>;
  middlewares: Array<string>;
  addApp(name: string): IDjangoApp;
}

export {
  DjangoVersion,
}

export type {
  IDjangoProject,
  IDjangoApp,
  IDjangoModel,
  IDjangoField,
  IDjangoRelationship,
  IRelatedField,
  IParentField,
  IBuiltInModel,
  IFieldType,
  IFieldTestDefault,
  IRelationshipType
}