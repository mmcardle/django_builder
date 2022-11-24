import { template as projectSettings } from "./django/python/settings";
import { template as projectURLs } from "./django/python/urls";
import { template as projectViews } from "./django/python/views";
import { template as projectWsgi } from "./django/python/wsgi";
import { template as projectAsgi } from "./django/python/asgi";
import { template as projectManage } from "./django/python/manage";
import { template as appHTMX } from "./django/python/htmx";
import { template as testHelpers } from "./django/python/test_helpers";
import { template as projectConsumers } from "./django/python/consumers";
import { template as appConsumers } from "./django/python/app_consumers";
import { template as requirements } from "./django/requirements/requirements";
import { template as requirements_dev } from "./django/requirements/requirements_dev";
import { template as htmx_html } from "./django/templates/htmx/htmx.html";
import { template as htmx_list_html } from "./django/templates/htmx/list.html";
import { template as htmx_form_html } from "./django/templates/htmx/form.html";
import { template as htmx_create_html } from "./django/templates/htmx/create.html";
import { template as htmx_delete_button_html } from "./django/templates/htmx/delete_button.html";


import Handlebars from "handlebars"
import DjangoProject, { DjangoApp } from './api';

Handlebars.registerHelper("raw", function(options) {
  return options.fn();
});

type DjangoContext = Record<string, DjangoProject | DjangoApp>;

export default class Renderer {

  compiledProjectSettings: HandlebarsTemplateDelegate<any>

  constructor() {
    // TODO - compile first
    this.compiledProjectSettings = Handlebars.compile(projectSettings)
  }

  baseContext() {
    const context: Record<string, string> = {}
    return context;
  }

  renderTemplate(template: string, context: DjangoContext): string {
    return Handlebars.compile(template)(
      {...context, ...this.baseContext()},
    );
  }

  renderProjectFile(file: string, project: DjangoProject) {
    let template;
    switch (file) {
      case "settings.py": template = projectSettings; break;
      case "urls.py": template = projectURLs; break;
      case "views.py": template = projectViews; break;
      case "wsgi.py": template = projectWsgi; break;
      case "manage.py": template = projectManage; break;
      case "consumers.py": template = projectConsumers; break;
      case "asgi.py": template = projectAsgi; break;
      case "test_helpers.py": template = testHelpers; break;
      case "requirements.txt": template = requirements; break;
      case "requirements-dev.txt": template = requirements_dev; break;
      case "htmx.html": template = htmx_html; break;
      case "list.html": template = htmx_list_html; break;
      case "form.html": template = htmx_form_html; break;
      case "create.html": template = htmx_create_html; break;
      case "delete_button.html": template = htmx_delete_button_html; break;
      default:
        throw Error(`No project template for ${file}`)
    }
    console.log("Rendered ==>", file)
    return this.renderTemplate(template, {project})
  }

  renderAppFile(file: string, app: DjangoApp) {
    let template;
    switch (file) {
      case "htmx.py": template = appHTMX; break;
      case "consumers.py": template = appConsumers; break;
      default:
        throw Error(`No app template for ${file}`)
    }
    return this.renderTemplate(template, {app})
  }

}
