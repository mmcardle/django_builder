
import { IDjangoApp, IDjangoProject, DjangoVersion, IDjangoModel, IDjangoField, IDjangoRelationship } from "./types";

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

export class DjangoModel implements IDjangoModel {
  name: string;
  fields: IDjangoField[] = [];
  relationships: IDjangoRelationship[] = [];

  constructor(
    name: string,
    fields?: IDjangoField[]
  ) {
    this.name = name;
    if (fields) {
      this.fields = fields;
    }
  }

  addField(field: IDjangoField): void {
    this.fields.push(field)
  }
}

export class DjangoApp implements IDjangoApp {
  name: string;
  models: IDjangoModel[] = [];

  constructor(
    name: string,
    models?: IDjangoModel[]
  ) {
    this.name = name;
    if (models) {
      this.models = models;
    }
  }

  get nameCamelCase() {
    return this.name.slice(0, 1).toUpperCase() + this.name.slice(1)
  }

  addModel(model: IDjangoModel): void {
    this.models.push(model)
  }
}

class DjangoProject implements IDjangoProject {
  name: string;
  version: DjangoVersion;
  description: string;
  channels: boolean;
  htmx: boolean;
  apps: Array<IDjangoApp> = [];
  
  constructor(
    name: string,
    description: string = "",
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
  }

  get middlewares() {
    if (this.htmx)
      return [...DEFAULT_MIDDLEWARES, HTMX_MIDDLEWARE]
    return DEFAULT_MIDDLEWARES
  }

  addApp(app: IDjangoApp): void {
    this.apps.push(app);
  }
}

export default DjangoProject