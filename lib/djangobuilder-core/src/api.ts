
import {
  IDjangoApp,
  IDjangoProject,
  DjangoVersion,
  IDjangoModel,
  IDjangoField,
  IDjangoRelationship,
  IBuiltInModel
} from "./types";

const DEFAULT_MIDDLEWARES = [
  'django.middleware.security.SecurityMiddleware',
  'django.contrib.sessions.middleware.SessionMiddleware',
  'django.middleware.common.CommonMiddleware',
  'django.middleware.csrf.CsrfViewMiddleware',
  'django.contrib.auth.middleware.AuthenticationMiddleware',
  'django.contrib.messages.middleware.MessageMiddleware',
  'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

const HTMX_MIDDLEWARE = 'django_htmx.middleware.HtmxMiddleware'


export const AuthUser: IBuiltInModel = {
  name: "auth.User",
}

export class DjangoRelationship implements IDjangoRelationship {
  model: IDjangoModel;
  name: string;
  type: string;
  to: string;
  args: string;

  constructor(
    model: IDjangoModel,
    name: string,
    type: string,
    to: string,
    args: string,
  ) {
    this.model = model;
    this.name = name;
    this.type = type;
    this.to = to;
    this.args = args;
  }
}

export class DjangoField implements IDjangoField {
  model: IDjangoModel;
  name: string;
  type: string;
  args: string;

  constructor(
    model: IDjangoModel,
    name: string,
    type: string,
    args: string,
  ) {
    this.model = model;
    this.name = name;
    this.type = type;
    this.args = args;
  }
}

export class DjangoModel implements IDjangoModel {
  app: IDjangoApp;
  name: string;
  fields: IDjangoField[] = [];
  relationships: IDjangoRelationship[] = [];
  
  abstract = false;
  
  primaryKey = "pk";
  relatedName: string

  constructor(
    app: IDjangoApp,
    name: string,
    abstract?: boolean,
    fields?: IDjangoField[],
    relationships?: IDjangoRelationship[],
  ) {
    this.app = app;
    this.name = name;
    this.relatedName = name;
    if (abstract !== undefined) {
      this.abstract = abstract;
    }
    if (fields) {
      this.fields = fields;
    }
    if (relationships) {
      this.relationships = relationships;
    }
  }

  addField(name: string, type: string, args: string): DjangoField {
    const field = new DjangoField(this, name, type, args);
    this.fields.push(field);
    return field;
  }

  addRelationship(name: string, type: string, to: IDjangoModel | IBuiltInModel, args: string): DjangoRelationship {
    
    const relatedTo = to instanceof DjangoModel ? to.app.name + "." + to.name : to.name;

    const relationship = new DjangoRelationship(this, name, type, relatedTo, args);
    this.relationships.push(relationship)
    return relationship;
  }

}

export class DjangoApp implements IDjangoApp {
  project: IDjangoProject;
  name: string;
  models: DjangoModel[] = [];

  constructor(
    project: IDjangoProject,
    name: string,
    models?: DjangoModel[]
  ) {
    this.project = project;
    this.name = name;
    if (models) {
      this.models = models;
    }
  }

  addModel(name: string, abstract: boolean | undefined = false): DjangoModel {
    const model = new DjangoModel(this, name, abstract);
    this.models.push(model);
    return model;
  }

  get concreteModels(): IDjangoModel[] {
    return this.models.filter(model => !model.abstract)
  }
}

class DjangoProject implements IDjangoProject {
  name: string;
  version: DjangoVersion;
  description: string;
  channels: boolean;
  htmx: boolean;
  apps: Array<IDjangoApp> = [];
  middlewares: Array<string> = [];
  
  constructor(
    name: string,
    description = "",
    version: DjangoVersion = DjangoVersion.DJANGO4,
    {
      channels=true,
      htmx=true,
    }
  ) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.channels = channels;
    this.htmx = htmx;
    this.apps = [];
    this.middlewares = DEFAULT_MIDDLEWARES
    if (this.htmx) {
      this.middlewares.push(HTMX_MIDDLEWARE)
    }
  }

  addApp(name: string): DjangoApp {
    const app = new DjangoApp(this, name);
    this.apps.push(app);
    return app;
  }
}

export default DjangoProject