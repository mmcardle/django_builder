import { template as projectSettings } from "./django/python/settings";
import { template as projectURLs } from "./django/python/urls";
import { template as projectViews } from "./django/python/views";
import { template as projectWsgi } from "./django/python/wsgi";
import { template as projectAsgi } from "./django/python/asgi";
import { template as projectManage } from "./django/python/manage";
import { template as projectConsumers } from "./django/python/consumers";

import { template as rootTestHelpers } from "./django/python/test_helpers";
import { template as rootRequirements } from "./django/requirements/requirements";
import { template as rootRequirementsDev } from "./django/requirements/requirements_dev";
import { template as rootPytestIni } from "./django/tests/pytest.ini";
import { template as rootTestRequirements } from "./django/tests/test_requirements_txt";
import { template as rootTestSettings } from "./django/tests/test_settings";

import { template as baseHtml } from "./django/templates/base.html";
import { template as indexHtml } from "./django/templates/index.html";

import { template as appListHtml } from "./django/templates/app/list.html";
import { template as appFormHtml } from "./django/templates/app/form.html";
import { template as appDetailHtml } from "./django/templates/app/detail.html";
import { template as appConfirmDeleteHtml } from "./django/templates/app/confirm_delete.html";

import { template as htmxHtml } from "./django/templates/htmx/htmx.html";
import { template as htmxListHtml } from "./django/templates/htmx/list.html";
import { template as htmxFormHtml } from "./django/templates/htmx/form.html";
import { template as htmxCreateHtml } from "./django/templates/htmx/create.html";

import { template as htmxDeleteButtonHtml } from "./django/templates/htmx/delete_button.html";
import { template as appModels } from "./django/python/app/models";
import { template as appUrls } from "./django/python/app/urls";
import { template as appHTMX } from "./django/python/app/htmx";
import { template as appConsumers } from "./django/python/app/consumers";
import { template as appForms } from "./django/python/app/forms";
import { template as appViews } from "./django/python/app/views";
import { template as appApi } from "./django/python/app/api";
import { template as appSerializers } from "./django/python/app/serializers";
import { template as appAdmin } from "./django/python/app/admin";
import { template as init } from "./django/python/init";

import Tarball from './tar'
import Handlebars from "handlebars"
import DjangoProject, { DjangoApp, DjangoModel } from './api';
import { IDjangoModel } from "./types";

Handlebars.registerHelper("raw", (options) => options.fn());
Handlebars.registerHelper("object", (str: string) => "{{ object." + str + " }}");
Handlebars.registerHelper("open", () => "{{");
Handlebars.registerHelper("close", () =>  "}}");
Handlebars.registerHelper("camelCase", (str: string) => str.slice(0, 1).toUpperCase() + str.slice(1));

type DjangoContext = Record<
  string,
  DjangoProject | DjangoModel | DjangoApp
>;


const PYTEST_INI = "pytest.ini";
const TEST_HELPERS = "test_helpers.py";
const TEST_SETTINGS = "test_settings.py";
const REQUIREMENTS_TXT = "requirements.txt";
const REQUIREMENTS_DEV_TXT = "requirements-dev.txt";

const SETTINGS = "settings.py";
const WSGI = "wsgi.py";
const MANAGE = "manage.py";
const ASGI = "asgi.py";
const __INIT__ = "__init__.py";

const MODELS = "models.py";
const VIEWS = "views.py";
const HTMX = "htmx.py";
const FORMS = "forms.py";
const URLS = "urls.py";
const API = "api.py";
const SERIALIZERS = "serializers.py";
const ADMIN = "admin.py";
const CONSUMERS = "consumers.py";

const BASE_HTML = "base.html"
const INDEX_HTML = "index.html"

const HTMX_HTML = "htmx.html"
const LIST = "list.html"
const FORM = "form.html"
const DETAIL = "detail.html"
const CREATE = "create.html"
const CONFIRM_DELETE = "confirm_delete.html"
const DELETE_BUTTON = "delete_button.html"

const TEST_REQUIREMENTS_TXT = "test_requirements.txt"
const TEST_SETTINGS_PY = "test_settings.py"


export const ROOT_FILES = {
  [`${MANAGE}`]: projectManage,
  [`${PYTEST_INI}`]: rootPytestIni,
  [`${TEST_HELPERS}`]: rootTestHelpers,
  [`${TEST_SETTINGS}`]: rootTestSettings,
  [`${REQUIREMENTS_TXT}`]: rootRequirements,
  [`${REQUIREMENTS_DEV_TXT}`]: rootRequirementsDev,
  [`${TEST_REQUIREMENTS_TXT}`] : rootTestRequirements,
  [`${TEST_SETTINGS_PY}`] : rootTestSettings,
}

export const PROJECT_FILES = {
  [`${SETTINGS}`]: projectSettings,
  [`${URLS}`]: projectURLs,
  [`${VIEWS}`]: projectViews,
  [`${WSGI}`]: projectWsgi,
  [`${CONSUMERS}`]: projectConsumers,
  [`${ASGI}`]: projectAsgi,
  [`${__INIT__}`]: init,
}

export const PROJECT_TEMPLATE_FILES = {
  [`${BASE_HTML}`]: baseHtml,
  [`${INDEX_HTML}`]: indexHtml,
}

export const PROJECT_HTMX_TEMPLATE_FILES = {
  [`${HTMX_HTML}`]: htmxHtml,
  [`${LIST}`]: htmxListHtml,
  [`${FORM}`]: htmxFormHtml,
  [`${CREATE}`]: htmxCreateHtml,
  [`${DELETE_BUTTON}`]: htmxDeleteButtonHtml,
}

export const APP_FILES = {
  [`${MODELS}`]: appModels,
  [`${VIEWS}`]: appViews,
  [`${HTMX}`]: appHTMX,
  [`${FORMS}`]: appForms,
  [`${URLS}`]: appUrls,
  [`${API}`]: appApi,
  [`${SERIALIZERS}`]: appSerializers,
  [`${ADMIN}`]: appAdmin,
  [`${CONSUMERS}`]: appConsumers,
  [`${__INIT__}`]: init,
}

export const MODEL_TEMPLATE_FILES = {
  [`${LIST}`]: appListHtml,
  [`${FORM}`]: appFormHtml,
  [`${DETAIL}`]: appDetailHtml,
  [`${CONFIRM_DELETE}`]: appConfirmDeleteHtml,
}


export default class Renderer {

  // compiledProjectSettings: HandlebarsTemplateDelegate<string>
  
  constructor() {
    // TODO - compile first
    // this.compiledProjectSettings = Handlebars.compile(projectSettings)
  }

  baseContext() {
    const context: Record<string, string> = {}
    return context;
  }

  renderTemplate(template: string, context: DjangoContext): string {
    return Handlebars.compile(template)(
      {...context, ...this.baseContext()}
    );
  }

  renderProjectFile(file: string, project: DjangoProject) {
    const template = PROJECT_FILES[file] || PROJECT_TEMPLATE_FILES[file] || ROOT_FILES[file] || PROJECT_HTMX_TEMPLATE_FILES[file];
    if (template) {
      return this.renderTemplate(template, {project})
    } else {
      throw Error(`No project template for ${file}`)
    }
  }

  renderModelFile(file: string, model: DjangoModel) {
    const template = MODEL_TEMPLATE_FILES[file];
    if (template) {
      return this.renderTemplate(template, {model})
    } else {
      throw Error(`No model template for ${file}`)
    }
  }

  renderAppFile(file: string, app: DjangoApp) {
    const template = APP_FILES[file];
    if (template) {
      return this.renderTemplate(template, {app})
    } else {
      throw Error(`No app template for ${file}`)
    }
  }

  addProjectFileToTarball(tarball: Tarball, project: DjangoProject, filename: string, filepath?: string) {
    const content = this.renderProjectFile(filename, project);
    const tarpath = filepath ? filepath : `${project.name}/${project.name}/${filename}`;
    tarball.append(tarpath, content);
  }

  addRootFileToTarball(tarball: Tarball, project: DjangoProject, filename: string) {
    const content = this.renderProjectFile(filename, project);
    tarball.append(`${project.name}/${filename}`, content);
  }

  addAppFileToTarball(tarball: Tarball, app: DjangoApp, filename: string, filepath?: string) {
    const content = this.renderAppFile(filename, app);
    const tarpath = filepath ? filepath : `${app.project.name}/${app.name}/${filename}`;
    tarball.append(tarpath, content);
  }

  addModelFileToTarball(tarball: Tarball, model: DjangoModel, filename: string, filepath?: string) {
    const content = this.renderModelFile(filename, model);
    const tarpath = filepath ? filepath : `${model.app.project.name}/${model.app.name}/${filename}`;
    tarball.append(tarpath, content);
  }

  asTarball(project: DjangoProject) {
    const tarball = new Tarball();

    Object.keys(PROJECT_FILES).forEach(projectFile => {
      this.addProjectFileToTarball(tarball, project, projectFile);
    })

    Object.keys(PROJECT_TEMPLATE_FILES).forEach(projectTemplateFile => {
      this.addProjectFileToTarball(tarball, project, projectTemplateFile, `${project.name}/templates/${projectTemplateFile}`);
    })

    Object.keys(PROJECT_HTMX_TEMPLATE_FILES).forEach(projectHTMXTemplateFile => {
      this.addProjectFileToTarball(tarball, project, projectHTMXTemplateFile, `${project.name}/templates/htmx/${projectHTMXTemplateFile}`);
    })

    Object.keys(ROOT_FILES).forEach(rootFile => {
      this.addRootFileToTarball(tarball, project, rootFile);
    })
    
    project.apps.forEach(app => {
      Object.keys(APP_FILES).forEach(appFile => {
        this.addAppFileToTarball(tarball, app as DjangoApp, appFile);
        app.models.forEach((model: IDjangoModel) => {
          Object.keys(MODEL_TEMPLATE_FILES).forEach(modelFile => {
            this.addModelFileToTarball(
              tarball,
              model as DjangoModel,
              modelFile,
              `${app.project.name}/${app.name}/templates/${app.name}/${model.name.toLowerCase()}_${modelFile}`);
          })
        })
        
      })
      this.addAppFileToTarball(tarball, app as DjangoApp, "__init__.py", `${app.project.name}/${app.name}/migrations/__init__.py`);
    })

    return tarball.get_content();
  }

}
