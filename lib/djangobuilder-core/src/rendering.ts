import { template as projectSettings } from "./django/python/settings";
import { template as projectURLs } from "./django/python/urls";
import { template as projectViews } from "./django/python/views";
import { template as projectWsgi } from "./django/python/wsgi";
import { template as projectAsgi } from "./django/python/asgi";
import { template as projectManage } from "./django/python/manage";
import { template as projectConsumers } from "./django/python/consumers";
import { template as projectRouting } from "./django/python/routing";

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

import { template as appTestViews } from "./django/python/app/tests/test_views";

import { template as init } from "./django/python/init";

import Tarball from "./tar";
import Handlebars from "handlebars";
import DjangoProject, {
  BuiltInModel,
  DjangoApp,
  DjangoField,
  DjangoModel,
  DjangoRelationship,
  ManyToManyRelationship,
} from "./api";
import type { IBuiltInModel, IDjangoModel, IParentField } from "./types";

Handlebars.registerHelper("raw", (options) => options.fn());
Handlebars.registerHelper(
  "object",
  (str: string) => "{{ object." + str + " }}"
);
Handlebars.registerHelper("open", () => "{{");
Handlebars.registerHelper("close", () => "}}");
Handlebars.registerHelper(
  "camelCase",
  (str: string) => str.slice(0, 1).toUpperCase() + str.slice(1)
);
Handlebars.registerHelper("relatedTo", (relationship: DjangoRelationship) =>
  relationship.relatedTo()
);

Handlebars.registerHelper("modelParents", (modelParents: IParentField[]) =>
  {
    if (modelParents.length === 0) {
      return "models.Model"
    }
    return modelParents.filter(parent => parent !== undefined).map(parent => {
      if ((parent as IBuiltInModel).model) {
        return (parent as IBuiltInModel).model
      }
      return parent.name
    }).join(", ")
  }
);

Handlebars.registerHelper("importModule", (field: DjangoField) =>
  field.importModule()
);

Handlebars.registerHelper(
  "isManyToMany",
  (relationship: DjangoRelationship, options) => {
    if (relationship.type === ManyToManyRelationship) {
      return options.fn(relationship);
    }
  }
);
Handlebars.registerHelper(
  "isNotManyToMany",
  (relationship: DjangoRelationship, options) => {
    if (relationship.type !== ManyToManyRelationship) {
      return options.fn(relationship);
    }
  }
);

Handlebars.registerHelper(
  "testViewsCreateDefaultField",
  (field: DjangoField) => {
    if (Array.isArray(field.type.testDefault)) {
      return (field.type.testDefault as Array<string | number>)
        .map((fieldDefault, i) => `'${field.name}_${i}': ${fieldDefault},`)
        .join("\n      ");
    }
    return `'${field.name}': ${field.type.testDefault},`;
  }
);

Handlebars.registerHelper(
  "testHelperCreateDefaultField",
  (field: DjangoField) => {
    return `'${field.name}': ${
      field.type.viewDefault || field.type.testDefault
    },`;
  }
);

Handlebars.registerHelper(
  "testHelperCreateDefaultRelationship",
  (relationship: DjangoRelationship) => {
    if (relationship.to instanceof BuiltInModel) {
      return `${relationship.to.model}()`;
    }
    if (relationship.to instanceof DjangoModel) {
      return `${relationship.to.app.name}_${relationship.to.name}()`;
    }
    if (typeof relationship.to === "string") {
      return relationship.to
    }
    throw Error(
      `Could not create test helper for ${relationship.name} ${relationship.type} ${relationship.to.name} ${JSON.stringify(relationship.to)}`
    );
  }
);

type DjangoRenderingContext = Record<
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
const ROUTING = "routing.py";
const ADMIN = "admin.py";
const CONSUMERS = "consumers.py";

const BASE_HTML = "base.html";
const INDEX_HTML = "index.html";

const HTMX_HTML = "htmx.html";
const LIST = "list.html";
const FORM = "form.html";
const DETAIL = "detail.html";
const CREATE = "create.html";
const CONFIRM_DELETE = "confirm_delete.html";
const DELETE_BUTTON = "delete_button.html";

const TEST_REQUIREMENTS_TXT = "test_requirements.txt";

const TEST_VIEWS = "test_views.py";

export enum DjangoProjectFileResource {
  FOLDER,
  PROJECT_FILE,
  APP_FILE,
  MODEL_FILE,
}

export type DjangoEntity =
  | DjangoProject
  | DjangoApp
  | DjangoModel
  | DjangoField
  | DjangoRelationship;

export type DjangoProjectFile = {
  resource: DjangoEntity;
  type: DjangoProjectFileResource;
  path: string;
  name: string;
  folder: boolean;
  modelName?: string | null;
  children?: Array<DjangoProjectFile> | null;
};

export const ROOT_FILES = {
  [`${MANAGE}`]: projectManage,
  [`${PYTEST_INI}`]: rootPytestIni,
  [`${TEST_HELPERS}`]: rootTestHelpers,
  [`${TEST_SETTINGS}`]: rootTestSettings,
  [`${REQUIREMENTS_TXT}`]: rootRequirements,
  [`${REQUIREMENTS_DEV_TXT}`]: rootRequirementsDev,
  [`${TEST_REQUIREMENTS_TXT}`]: rootTestRequirements,
};

export const PROJECT_FILES = {
  [`${SETTINGS}`]: projectSettings,
  [`${URLS}`]: projectURLs,
  [`${VIEWS}`]: projectViews,
  [`${WSGI}`]: projectWsgi,
  [`${CONSUMERS}`]: projectConsumers,
  [`${ROUTING}`]: projectRouting,
  [`${ASGI}`]: projectAsgi,
  [`${__INIT__}`]: init,
};

export const PROJECT_TEMPLATE_FILES = {
  [`${BASE_HTML}`]: baseHtml,
  [`${INDEX_HTML}`]: indexHtml,
};

export const PROJECT_HTMX_TEMPLATE_FILES = {
  [`${HTMX_HTML}`]: htmxHtml,
  [`${LIST}`]: htmxListHtml,
  [`${FORM}`]: htmxFormHtml,
  [`${CREATE}`]: htmxCreateHtml,
  [`${DELETE_BUTTON}`]: htmxDeleteButtonHtml,
};

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
};

export const APP_TEST_FILES = {
  [`${TEST_VIEWS}`]: appTestViews,
  [`${__INIT__}`]: init,
};

export const MODEL_TEMPLATE_FILES = {
  [`${LIST}`]: appListHtml,
  [`${FORM}`]: appFormHtml,
  [`${DETAIL}`]: appDetailHtml,
  [`${CONFIRM_DELETE}`]: appConfirmDeleteHtml,
};

export default class Renderer {
  // compiledProjectSettings: HandlebarsTemplateDelegate<string>

  constructor() {
    // TODO - compile first
    // this.compiledProjectSettings = Handlebars.compile(projectSettings)
  }

  baseContext() {
    const context: Record<string, string> = {};
    return context;
  }

  renderTemplate(template: string, context: DjangoRenderingContext): string {
    return Handlebars.compile(template)({ ...context, ...this.baseContext() });
  }

  renderProjectFile(file: string, project: DjangoProject) {
    const template =
      PROJECT_FILES[file as keyof typeof PROJECT_FILES] ||
      PROJECT_TEMPLATE_FILES[file as keyof typeof PROJECT_TEMPLATE_FILES] ||
      ROOT_FILES[file as keyof typeof ROOT_FILES] ||
      PROJECT_HTMX_TEMPLATE_FILES[file as keyof typeof PROJECT_HTMX_TEMPLATE_FILES];
    if (template) {
      return this.renderTemplate(template, { project });
    } else {
      throw Error(`No project template for ${file}`);
    }
  }

  renderModelFile(file: string, model: DjangoModel) {
    const foundtemplate = Object.keys(MODEL_TEMPLATE_FILES).find((template_file) =>
      file.endsWith(template_file)
    );
    if (foundtemplate) {
      return this.renderTemplate(MODEL_TEMPLATE_FILES[foundtemplate as keyof typeof MODEL_TEMPLATE_FILES], { model });
    } else {
      throw Error(`No model template for ${file}`);
    }
  }

  renderAppFile(file: string, app: DjangoApp) {
    const template = APP_FILES[file as keyof typeof APP_FILES] || APP_TEST_FILES[file as keyof typeof APP_TEST_FILES];
    if (template) {
      return this.renderTemplate(template, { app });
    } else {
      throw Error(`No app template for ${file}`);
    }
  }

  addProjectFileToTarball(
    tarball: Tarball,
    project: DjangoProject,
    filename: string,
    filepath?: string
  ) {
    const content = this.renderProjectFile(filename, project);
    const tarpath = filepath
      ? filepath
      : `${project.name}/${project.name}/${filename}`;
    tarball.append(tarpath, content);
  }

  addRootFileToTarball(
    tarball: Tarball,
    project: DjangoProject,
    filename: string
  ) {
    const content = this.renderProjectFile(filename, project);
    tarball.append(`${project.name}/${filename}`, content);
  }

  addAppFileToTarball(
    tarball: Tarball,
    app: DjangoApp,
    filename: string,
    filepath?: string
  ) {
    const content = this.renderAppFile(filename, app);
    const tarpath = filepath
      ? filepath
      : `${app.project.name}/${app.name}/${filename}`;
    tarball.append(tarpath, content);
  }

  addModelFileToTarball(
    tarball: Tarball,
    model: DjangoModel,
    filename: string,
    filepath?: string
  ) {
    const content = this.renderModelFile(filename, model);
    const tarpath = filepath
      ? filepath
      : `${model.app.project.name}/${model.app.name}/${filename}`;
    tarball.append(tarpath, content);
  }

  asTree(project: DjangoProject): DjangoProjectFile[] {
    const project_children: DjangoProjectFile[] = Object.keys(
      PROJECT_FILES
    ).map((render_name) => {
      return {
        resource: project,
        type: DjangoProjectFileResource.PROJECT_FILE,
        path: project.name + "/" + render_name,
        name: render_name,
        folder: false,
      };
    });

    const project_item = {
      resource: project,
      type: DjangoProjectFileResource.FOLDER,
      path: project.name,
      name: project.name,
      folder: true,
      children: project_children,
    };

    const apps = project.apps.map((app) => {
      const model_templates: DjangoProjectFile[] = [];

      app.models.forEach((model) => {
        model_templates.push(
          ...Object.keys(MODEL_TEMPLATE_FILES).map((render_name) => {
            const fileName = model.name.toLowerCase() + "_" + render_name;
            return {
              resource: model as DjangoModel,
              type: DjangoProjectFileResource.MODEL_FILE,
              appName: app.name,
              modelName: model.name,
              path: app.name + "/templates/" + app.name + "/" + fileName,
              folder: false,
              name: fileName,
            };
          })
        );
      });

      const model_children: DjangoProjectFile[] = Object.keys(APP_FILES).map(
        (render_name) => {
          return {
            resource: app as DjangoApp,
            type: DjangoProjectFileResource.APP_FILE,
            path: app.name + "/" + render_name,
            name: render_name,
            folder: false,
          };
        }
      );

      const appTemplateRootFolder: DjangoProjectFile = {
        resource: app as DjangoApp,
        type: DjangoProjectFileResource.FOLDER,
        path: app.name + "/templates/" + app.name,
        name: "templates/" + app.name,
        folder: true,
        children: model_templates,
      }

      model_children.push(appTemplateRootFolder)

      const migrationInit: DjangoProjectFile = {
        resource: app as DjangoApp,
        type: DjangoProjectFileResource.APP_FILE,
        path: app.name + "/migrations/__init__.py",
        name: "__init__.py",
        folder: false,
      }

      const migrationFolder = {
        resource: app as DjangoApp,
        type: DjangoProjectFileResource.FOLDER,
        path: app.name + "/migrations/",
        name: "migrations",
        folder: true,
        children: [
          migrationInit
        ],
      }

      model_children.push(migrationFolder)

      return {
        resource: app as DjangoApp,
        type: DjangoProjectFileResource.FOLDER,
        path: app.name,
        name: app.name,
        folder: true,
        children: model_children,
      };
    });

    const root_items: DjangoProjectFile[] = Object.keys(ROOT_FILES).map(
      (render_name) => {
        return {
          resource: project,
          type: DjangoProjectFileResource.PROJECT_FILE,
          path: render_name,
          name: render_name,
          folder: false,
        };
      }
    );

    const test_items: DjangoProjectFile[] = [
      {
        resource: project,
        type: DjangoProjectFileResource.FOLDER,
        path: "tests",
        name: "tests",
        folder: true,
        children: project.apps.map((app) => {
          return {
            resource: app as DjangoApp,
            type: DjangoProjectFileResource.APP_FILE,
            path: "tests/" + app.name,
            name: app.name,
            folder: true,
            children: Object.keys(APP_TEST_FILES).map((render_name) => {
              return {
                resource: app as DjangoApp,
                type: DjangoProjectFileResource.APP_FILE,
                path: "tests/" + app.name + "/" + render_name,
                name: render_name,
                folder: false,
              };
            }),
          };
        }),
      },
    ];

    const template_children: DjangoProjectFile[] = Object.keys(
      PROJECT_TEMPLATE_FILES
    ).map((name) => {
      const path = "templates/" + name;
      return {
        resource: project as DjangoProject,
        type: DjangoProjectFileResource.PROJECT_FILE,
        path,
        name,
        folder: false,
      };
    });

    const template_items: DjangoProjectFile[] = [
      {
        resource: project as DjangoProject,
        type: DjangoProjectFileResource.FOLDER,
        path: "templates",
        name: "templates",
        folder: true,
        children: template_children,
      },
    ];


    return [
      project_item,
      ...apps,
      ...template_items,
      ...test_items,
      ...root_items,
    ];
  }

  reduce(nodes: DjangoProjectFile[]) : DjangoProjectFile[]  {
    let result: Array<DjangoProjectFile> = nodes
    nodes.forEach((node) => {
      if (node.children) {
        result = result.concat(this.reduce(node.children))
      }
    })
    return result
  }

  asFlat(project: DjangoProject): DjangoProjectFile[] {
    const tree = this.asTree(project);
    return this.reduce(tree);
  }

  tarball(project: DjangoProject): Tarball {
    const tarball = new Tarball();

    Object.keys(PROJECT_FILES).forEach((projectFile) => {
      this.addProjectFileToTarball(tarball, project, projectFile);
    });

    Object.keys(PROJECT_TEMPLATE_FILES).forEach((projectTemplateFile) => {
      this.addProjectFileToTarball(
        tarball,
        project,
        projectTemplateFile,
        `${project.name}/templates/${projectTemplateFile}`
      );
    });

    Object.keys(PROJECT_HTMX_TEMPLATE_FILES).forEach(
      (projectHTMXTemplateFile) => {
        this.addProjectFileToTarball(
          tarball,
          project,
          projectHTMXTemplateFile,
          `${project.name}/templates/htmx/${projectHTMXTemplateFile}`
        );
      }
    );

    Object.keys(ROOT_FILES).forEach((rootFile) => {
      this.addRootFileToTarball(tarball, project, rootFile);
    });

    project.apps.forEach((app) => {
      Object.keys(APP_FILES).forEach((appFile) => {
        this.addAppFileToTarball(tarball, app as DjangoApp, appFile);
      });
      Object.keys(APP_TEST_FILES).forEach((appFile) => {
        this.addAppFileToTarball(
          tarball,
          app as DjangoApp,
          appFile,
          `${project.name}/tests/${app.name}/${appFile}`
        );
      });
      app.models
        .filter((model) => !model.abstract)
        .forEach((model: IDjangoModel) => {
          Object.keys(MODEL_TEMPLATE_FILES).forEach((modelFile) => {
            this.addModelFileToTarball(
              tarball,
              model as DjangoModel,
              modelFile,
              `${app.project.name}/${app.name}/templates/${
                app.name
              }/${model.name.toLowerCase()}_${modelFile}`
            );
          });
        });
      this.addAppFileToTarball(
        tarball,
        app as DjangoApp,
        "__init__.py",
        `${app.project.name}/${app.name}/migrations/__init__.py`
      );
    });

    return tarball;
  }

  tarballContent(project: DjangoProject): Uint8Array {
    return this.tarball(project).get_content();
  }

  tarballURL(project: DjangoProject): string {
    return this.tarball(project).get_url();
  }
}
