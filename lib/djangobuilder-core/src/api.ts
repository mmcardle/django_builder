
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
  model: DjangoModel;
  name: string;
  type: string;
  to: string;
  args: string;

  constructor(
    model: DjangoModel,
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
  model: DjangoModel;
  name: string;
  type: string;
  args: string;

  constructor(
    model: DjangoModel,
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
  app: DjangoApp;
  name: string;
  fields: IDjangoField[] = [];
  relationships: IDjangoRelationship[] = [];

  primaryKey = "pk";
  relatedName: string

  constructor(
    app: DjangoApp,
    name: string,
    fields?: IDjangoField[],
    relationships?: IDjangoRelationship[],
  ) {
    this.app = app;
    this.name = name;
    this.relatedName = name;
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
  project: DjangoProject;
  name: string;
  models: DjangoModel[] = [];

  constructor(
    project: DjangoProject,
    name: string,
    models?: DjangoModel[]
  ) {
    this.project = project;
    this.name = name;
    if (models) {
      this.models = models;
    }
  }

  get nameCamelCase() {
    return this.name.slice(0, 1).toUpperCase() + this.name.slice(1)
  }

  addModel(name: string): DjangoModel {
    const model = new DjangoModel(this, name);
    this.models.push(model);
    return model;
  }
}

class DjangoProject implements IDjangoProject {
  name: string;
  version: DjangoVersion;
  description: string;
  channels: boolean;
  htmx: boolean;
  apps: Array<DjangoApp> = [];
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