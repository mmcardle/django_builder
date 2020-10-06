import store from '@/store'
import Django from '@/django/'
import Tarball from '@/tar/'

import settings from '@/django/python/settings.py'
import manage from '@/django/python/manage.py'
import wsgi from '@/django/python/wsgi.py'
import urls from '@/django/python/urls.py'

import asgi from '@/django/python/asgi.py'
import routing from '@/django/python/routing.py'
import consumers from '@/django/python/consumers.py'
import app_consumers from '@/django/python/app_consumers.py'

import requirements_txt from '@/django/requirements/requirements.txt'

import test_settings from '@/django/tests/test_settings.py'
import test_requirements_txt from '@/django/tests/test_requirements.txt'
import _pytest_ini from '@/django/tests/pytest.ini'

import _base_html from '@/django/templates/base.html.tmpl'
import _channels_websocket_html from '@/django/templates/channels_websocket.html.tmpl'

const django = new Django()
const keys = Object.keys

class Renderer {

  _app_renderers = {
    'models.py': {function: this.models_py},
    'views.py': {function: this.views_py},
    'forms.py': {function: this.forms_py},
    'urls.py': {function: this.urls_py},
    'api.py': {function: this.api_py},
    'serializers.py': {function: this.serializers_py},
    'admin.py': {function: this.admin_py},
  }

  _template_renderers = {
    'list.html': {function: this.list_html},
    'detail.html': {function: this.detail_html},
    'form.html': {function: this.form_html},
  }

  _root_template_renderers = {
    'index.html': {function: this.index_html},
    'base.html': {function: this.base_html},
  }

  _test_renderers = {
    'test_views.py': {function: this.test_views_py},
  }

  _project_renderers = {
    'settings.py': {function: this.project_settings},
    'wsgi.py': {function: this.project_wsgi},
    'urls.py': {function: this.project_urls},
    'requirements.txt': {function: this.requirements},
    'test_requirements.txt': {function: this.test_requirements},
  }

  _root_renderers = {
    'manage.py': {function: this.project_manage},
    'pytest.ini': {function: this.pytest_ini},
    'test_settings.py': {function: this.test_settings_py},
    'test_helpers.py': {function: this.test_helpers_py},
  }

  _channels_renderers = {
    'asgi.py': {function: this.channels_asgi_py},
    'routing.py': {function: this.channels_routing_py},
    'consumers.py': {function: this.consumers_py},
  }

  _channels_app_renderers = {
    'consumers.py': {function: this.channels_app_consumers_py},
  }

  app_renderers() {
    return keys(this._app_renderers)
  }

  template_renderers() {
    return keys(this._template_renderers)
  }

  root_template_renderers() {
    return keys(this._root_template_renderers)
  }

  project_renderers() {
    return keys(this._project_renderers)
  }

  test_renderers() {
    return keys(this._test_renderers)
  }

  root_renderers() {
    return keys(this._root_renderers)
  }

  channels_renderers() {
    return keys(this._channels_renderers)
  }

  channels_app_renderers() {
    return keys(this._channels_app_renderers)
  }

  project_tree(projectid) {
    const project = store.getters.projectData(projectid)

    let project_children = this.project_renderers().map(render_name => {
      return {
        path: project.name + '/' + render_name,
        name: render_name,
        render: () => this.project_render(render_name, projectid)
      }
    })

    if (project.channels) {
      project_children.push(...this.channels_renderers().map(render_name => {
        return {
          path: project.name + '/' + render_name,
          name: render_name,
          render: () => this.channels_render(render_name, projectid)
        }
      }))
    }

    const project_item = {
      path: project.name,
      name: project.name,
      folder: true,
      children: project_children
    }

    const apps = keys(store.getters.projectData(projectid).apps).filter(
      app_id => store.getters.appData(app_id) !== undefined
    ).map(app_id =>{
      const app = store.getters.appData(app_id)

      if (app == undefined) return

      const models = this.get_models(app_id)

      let model_templates = []

      models.forEach((model) => {
        model_templates.push(...this.template_renderers().map(render_name => {
          const fileName = model.name.toLowerCase()  + '_' + render_name;
          return {
            path: app.name  + "/templates/" + app.name + '/' + fileName,
            name: fileName,
            render: () => this.template_render(render_name, app_id, model.id)
          }
        }))
      })

      let model_children = this.app_renderers().map(render_name => {
        return {
          path: app.name + '/' + render_name,
          name: render_name,
          render: () => this.app_render(render_name, app_id)
        }
      })

      if (project.channels) {
        model_children.push(...this.channels_app_renderers().map(render_name => {
          return {
            path: app.name + '/' + render_name,
            name: render_name,
            render: () => this.channels_app_render(render_name, app_id)
          }
        }))
      }

      model_children = model_children.concat(
        {
          path: app.name + "/templates/" + app.name,
          name: "templates/" + app.name,
          folder: true,
          children: model_templates
        }
      )

      return {
        path: app.name,
        name: app.name,
        folder: true,
        children: model_children
      }
    })

    const root_items = this.root_renderers().map(render_name => {
      return {
        path: render_name,
        name: render_name,
        render: () => this.root_render(render_name, projectid)
      }
    })

    const template_items = [
      {
        path: "templates",
        name: "templates",
        folder: true,
        children: this.root_template_renderers().map(render_name => {
          return {
            path: 'templates/' + render_name,
            name: render_name,
            render: () => this.root_template_render(render_name, projectid)
          }
        })
      }
    ]

    return [project_item].concat(apps).concat(template_items).concat(root_items)
  }

  project_flat(projectid, folders=false) {
    function flattenTree(arr, d = 1) {
      /* Flatten a tree structure to a flat list */
      return d > 0 ?
        arr.reduce(
          (acc, val) => acc.concat(
            Array.isArray(val.children) ?
              flattenTree(val.children, d - 1).concat([val]) : val
            ),
          []
        ):
        arr.slice();
    }

    const listing = flattenTree(this.project_tree(projectid))
    // Return folders if requested
    return listing.filter((item) => {
      return folders === true ? true : !item.folder
    })
  }

  app_render(render_name, appid) {
    if (!this._app_renderers[render_name]) {
      console.error('Unknown app render name', render_name)
      return ''
    }
    return this._app_renderers[render_name].function.apply(this, [appid])
  }

  channels_app_render(render_name, appid) {
    if (!this._channels_app_renderers[render_name]) {
      console.error('Unknown channel app render name', render_name)
      return ''
    }
    return this._channels_app_renderers[render_name].function.apply(this, [appid])
  }

  project_render(render_name, projectid) {
    if (!this._project_renderers[render_name]) {
      console.error('Unknown project render name', render_name)
      return ''
    }
    return this._project_renderers[render_name].function.apply(this, [projectid])
  }

  test_render(render_name, appid) {
    if (!this._test_renderers[render_name]) {
      console.error('Unknown test render name', render_name)
      return ''
    }
    return this._test_renderers[render_name].function.apply(this, [appid])
  }

  template_render(render_name, appid, modelid) {
    if (!this._template_renderers[render_name]) {
      console.error('Unknown template render name', render_name)
      return ''
    }
    return this._template_renderers[render_name].function.apply(this, [appid, modelid])
  }

  root_template_render(render_name, projectid) {
    if (!this._root_template_renderers[render_name]) {
      console.error('Unknown root template render name', render_name)
      return ''
    }
    return this._root_template_renderers[render_name].function.apply(this, [projectid])
  }

  root_render(render_name, projectid) {
    if (!this._root_renderers[render_name]) {
      console.error('Unknown root render name', render_name)
      return ''
    }
    return this._root_renderers[render_name].function.apply(this, [projectid])
  }

  channels_render(render_name, appid) {
    if (!this._channels_renderers[render_name]) {
      console.error('Unknown channel render name', render_name)
      return ''
    }
    return this._channels_renderers[render_name].function.apply(this, [appid])
  }

  get_apps(projectid) {
    const project = store.getters.projectData(projectid)
    return keys(project.apps).filter(app => store.getters.appData(app)).map((app) => {
      return Object.assign(store.getters.appData(app), {id: app})
    })
  }

  get_models(appid) {
    return store.getters.ordered_models(appid)
  }

  get_fields(model) {
    return keys(model.fields).map((field) => {
      return store.getters.fields()[field] ? store.getters.fields()[field].data() : [];
    })
  }

  get_identifier(model) {
    let type = 'int'
    let identifier = 'pk'
    const fields = this.get_fields(model)
    const slug_identifier = fields.find((f) => {
      return f.type === django.slug_type
    })
    if (slug_identifier) {
      type = 'slug'
      identifier = slug_identifier.name
    } else {
      const id_identifier = fields.find((f) => {
        return django.auto_types.indexOf(f.type) !== -1
      })
      if (id_identifier) {
        type = 'int'
        identifier = id_identifier.name
      }
    }
    return {type: type, identifier: identifier}
  }

  get_str(model) {
    let name = 'pk'
    const name_field = this.get_fields(model).find((f) => {
      return f.name === 'name'
    })
    if (name_field) {
      return name_field.name
    }
    return name
  }

  get_relationships(model) {
    return keys(model.relationships).map((relationship) => {
      return store.getters.relationships()[relationship].data()
    })
  }

  requirements (projectid) {
    const project = store.getters.projectData(projectid)
    let requirements = requirements_txt
    const DJANGO_3 = 'Django>=3,<4';
    const DJANGO_2 = 'Django>=2,<3';
    if (project.django_version === 3) {
      requirements = requirements.replace('XXX_DJANGO_VERSION_XXX', DJANGO_3)
    } else if (project.django_version == 2) {
      requirements = requirements.replace('XXX_DJANGO_VERSION_XXX', DJANGO_2)
    } else {
      console.error('Unknown Django version ' + project.django_version + ', defaulting to ' + DJANGO_3)
      requirements = requirements.replace('XXX_DJANGO_VERSION_XXX', DJANGO_3)
    }
    if (project.channels === true) {
      requirements += 'channels\n'
      requirements += 'channels_redis\n'
    }
    return requirements
  }

  test_requirements (_) {
    return test_requirements_txt
  }

  project_settings (projectid) {
    const project = store.getters.projectData(projectid)
    const apps = this.get_apps(projectid)
    let app_names = project.channels ? "'channels',\n    " : ''
    apps.forEach((app, i) => {
      if (i !== 0){
        app_names += "    "
      }
      app_names += "'" + app.name + "',"
      if (i !== keys(apps).length - 1){
        app_names += "\n"
      }
    })
    let _settings = settings
    _settings = settings
      .replace(/'XXX_PROJECT_APPS_XXX'/, app_names)
      .replace(/XXX_PROJECT_NAME_XXX/g, project.name)

    if (project.channels === true) {
      _settings += '\n# Django Channels\n'
      _settings += 'ASGI_APPLICATION = "' + project.name + '.routing.application"'
      _settings += `
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
        # Use a redis instance
        # "BACKEND": "channels_redis.core.RedisChannelLayer",
        # "CONFIG": {"hosts": [("127.0.0.1", 6379)],},
    },
}`
    }

    return _settings
  }

  init () {
    return ''
  }

  base_html (projectid) {
    const project = store.getters.projectData(projectid)
    let html = _base_html.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
    if (project.channels === true) {
      return html.replace(/XXX__EXTRA_BODY__XXX/g, _channels_websocket_html)
    } else {
      return html.replace(/XXX__EXTRA_BODY__XXX/g, "")
    }
  }

  index_html (projectid) {

    var output = `{% extends "base.html" %}`
    output += `\n{% block content %}`

    const apps = this.get_apps(projectid)

    apps.forEach((app) => {
      output += `\n<div class="m-2"><h4>${app.name}</h4></div>`
      this.get_models(app.id).forEach((model) => {
        output += `\n<div class="m-2"><a class="btn btn-light" href="{% url '${app.name}_${model.name}_list' %}">${model.name} Listing</a></div>`
      })
    })

    output += `\n{% endblock %}`

    return output
  }

  list_html (appid, modelid) {
    const appData = store.getters.appData(appid)
    const modelData = store.getters.modelData(modelid)

    var list_html = `
{% extends "base.html" %}
{% block content %}
{% for object in object_list %}
  <div class="m-2"><a href="{{object.get_absolute_url}}">{{object}}</a></div>
{% endfor %}
<div><a class="btn btn-primary" href="{% url '${appData.name}_${modelData.name}_create' %}">Create a new ${modelData.name}</a></div>
{% endblock %}
`
    return list_html
  }

  detail_html (appid, modelid) {
    let detail_html = `
{% extends "base.html" %}
{% load static %}
{% block content %}
    `

    const appData = store.getters.appData(appid)
    const modelData = store.getters.modelData(modelid)

    detail_html += `
<p>
    <a class="btn btn-light" href="{% url '${appData.name}_${modelData.name}_list' %}">
    ${modelData.name} Listing
    </a>
</p>
    `
    detail_html += `\n<table class="table">`

    this.get_fields(modelData).forEach((field) => {
      detail_html += `\n    <tr><td>${field.name}</td><td>{{ object.${field.name} }}</td></tr>`
    })

    detail_html += `\n</table>`
    detail_html += `\n<a class="btn btn-primary" href="{{object.get_update_url}}">Edit</a>`
    detail_html += `\n\n{% endblock %}`

    return detail_html
  }

  form_html (appid, modelid) {
    let detail_html = `
{% extends "base.html" %}
{% load static %}
{% block content %}
    `

    const appData = store.getters.appData(appid)
    const modelData = store.getters.modelData(modelid)

    detail_html += `
<p>
    <a class="btn btn-light" href="{% url '${appData.name}_${modelData.name}_list' %}">
    ${modelData.name} Listing
    </a>
</p>
    `
    detail_html += `\n<form method="post" enctype="multipart/form-data">`
    detail_html += `\n  {% csrf_token %}`
    detail_html += `\n  {{form.errors}}`

    this.get_fields(modelData).forEach((field) => {

      var html_field_type = "text"
      switch (field.type) {
        case 'django.db.models.DateTimeField':
          html_field_type = "datetime-local"
          break
        case 'django.db.models.DateField':
          html_field_type = "date"
          break
        case 'django.db.models.TimeField':
          html_field_type = "time"
          break
        case 'django.db.models.IntegerField':
          html_field_type = "number"
          break
        case 'django.db.models.FileField':
          html_field_type = "file"
          break
        case 'django.db.models.ImageField':
          html_field_type = "file"
          break
      }

      const disabled = field.args.indexOf('editable=False') !== -1

      detail_html += `\n  <div class="form-group row">`
      detail_html += `\n  <label class="col-sm-2 col-form-label" for="${field.name}">${field.name}: </label>`
      if (disabled) {
        detail_html += `\n  <input class="form-control col-sm-10" id="${field.name}" type="${html_field_type}" name="${field.name}" value="{{ object.${field.name} }}" disabled>`
      } else {
        detail_html += `\n  <input class="form-control col-sm-10" id="${field.name}" type="${html_field_type}" name="${field.name}" value="{{ object.${field.name} }}">`
      }
      detail_html += `\n  </div>`
    })

    detail_html += `\n  <input type="submit" value="Save" class="btn btn-primary">`
    detail_html += `\n</form>`

    detail_html += `\n\n{% endblock %}`

    return detail_html
  }

  channels_asgi_py (projectid) {
    const project = store.getters.projectData(projectid)
    return asgi.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  consumers_py (projectid) {
    const project = store.getters.projectData(projectid)
    return consumers.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  channels_routing_py (projectid) {
    const project = store.getters.projectData(projectid)
    let consumer_imports = '# Consumer Imports\n'
    let consumers = ''

    const apps = this.get_apps(projectid)
    apps.forEach((app) => {
      consumer_imports += "from " + app.name + ".consumers import " + app.name + 'Consumer\n'
    })

    apps.forEach((app) => {
      consumers += '    '
      consumers += '"' + app.name + '": ' + app.name +  'Consumer,'
    })

    return routing
      .replace(/XXX_CONSUMER_IMPORTS_XXX/g, consumer_imports)
      .replace(/XXX_CONSUMERS_XXX/g, consumers)
      .replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  project_manage (projectid) {
    const project = store.getters.projectData(projectid)
    return manage.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  pytest_ini (projectid) {
    const project = store.getters.projectData(projectid)
    return _pytest_ini.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  test_settings_py (projectid) {
    const project = store.getters.projectData(projectid)
    return test_settings.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  project_wsgi (projectid) {
    const project = store.getters.projectData(projectid)
    return wsgi.replace(/XXX_PROJECT_NAME_XXX/g, project.name)
  }

  project_urls (projectid) {
    const apps = this.get_apps(projectid)
    let app_names = ''
    apps.forEach((app, i) => {
      if (i !== 0){
        app_names += "    "
      }
      app_names += "path('" + app.name + "/', include('" + app.name + ".urls')),"
      if (i !== keys(apps).length - 1){
        app_names += "\n"
      }
    })
    return urls.replace("'XXX_PROJECT_URLS_XXX',", app_names)
  }

  urls_py(appid) {
    const appData = store.getters.appData(appid)
    let urls = 'from django.urls import path, include\n'
    urls += 'from rest_framework import routers\n'
    urls += '\n'
    urls += 'from . import api\n'
    urls += 'from . import views\n'
    urls += '\n\n'
    urls += 'router = routers.DefaultRouter()\n'

    const models = this.get_models(appid)

    models.forEach((model) => {
      urls += 'router.register("' + model.name + '", api.' + model.name + 'ViewSet)\n'
    })

    urls += '\n'
    urls += 'urlpatterns = (\n'
    urls += '    path("api/v1/", include(router.urls)),\n',

    models.forEach((model) => {
      urls += '    path('
      urls += '"' + appData.name + '/' + model.name + '/", views.' + model.name + 'ListView.as_view(), '
      urls += 'name="' + appData.name + '_' + model.name + '_list"),\n'
      urls += '    path('
      urls += '"' + appData.name + '/' + model.name + '/create/", views.' + model.name + 'CreateView.as_view(), '
      urls += 'name="' + appData.name + '_' + model.name + '_create"),\n'
      urls += '    path('

      const {type, identifier} = this.get_identifier(model)
      const id = '<' + type + ':' + identifier + '>'

      urls += '"' + appData.name + '/' + model.name + '/detail/' + id + '/", views.' + model.name + 'DetailView.as_view(), '
      urls += 'name="' + appData.name + '_' + model.name + '_detail"),\n'
      urls += '    path('
      urls += '"' + appData.name + '/' + model.name + '/update/' + id + '/", views.' + model.name + 'UpdateView.as_view(), '
      urls += 'name="' + appData.name + '_' + model.name + '_update"),\n'
    })
    urls += ')\n'

    return urls
  }

  api_py(appid) {
    let api = 'from rest_framework import viewsets, permissions\n'
    api += '\n'
    api += 'from . import serializers\n'
    api += 'from . import models\n'

    const models = this.get_models(appid)

    models.forEach((model) => {
      api += '\n\n'
      api += 'class ' + model.name + 'ViewSet(viewsets.ModelViewSet):\n'
      api += '    """ViewSet for the ' + model.name + ' class"""\n'
      api += '\n'
      api += '    queryset = models.' + model.name + '.objects.all()\n'
      api += '    serializer_class = serializers.' + model.name + 'Serializer\n'
      api += '    permission_classes = [permissions.IsAuthenticated]\n'
    })
    return api
  }

  serializers_py(appid) {
    let serializers = 'from rest_framework import serializers\n'
    serializers += '\n'
    serializers += 'from . import models\n'

    const models = this.get_models(appid)

    models.forEach((model) => {
      const fields = this.get_fields(model)
      serializers += '\n\n'
      serializers += 'class ' + model.name + 'Serializer(serializers.ModelSerializer):\n'
      serializers += '\n'
      serializers += '    class Meta:\n'
      serializers += '        model = models.' + model.name + '\n'
      serializers += '        fields = [\n'
      fields.forEach((field) => {
        serializers += '            "' + field.name + '",\n'
      })
      serializers += '        ]'
    })
    serializers += '\n'
    return serializers
  }

  admin_py(appid) {
    let admin = 'from django.contrib import admin\n'
    admin += 'from django import forms\n'
    admin += '\n'
    admin += 'from . import models\n'
    admin += '\n\n'

    const models = this.get_models(appid)

    models.forEach((model) => {
      admin += 'class ' + model.name + 'AdminForm(forms.ModelForm):\n'
      admin += '\n'
      admin += '    class Meta:\n'
      admin += '        model = models.' + model.name + '\n'
      admin += '        fields = "__all__"\n'
      admin += '\n\n'

      const fields = this.get_fields(model)

      admin += 'class ' + model.name + 'Admin(admin.ModelAdmin):\n'
      admin += '    form = ' + model.name + 'AdminForm\n'
      admin += '    list_display = [\n'
      fields.forEach((field) => {
        admin += '        "' + field.name + '",\n'
      })
      admin += '    ]\n'
      admin += '    readonly_fields = [\n'
      fields.forEach((field) => {
        admin += '        "' + field.name + '",\n'
      })
      admin += '    ]\n'
      admin += '\n\n'
    })
    models.forEach((model) => {
      admin += 'admin.site.register(models.' + model.name + ', '+ model.name + 'Admin)\n'
    })
    return admin
  }

  channels_app_consumers_py(appid) {
    const appData = store.getters.appData(appid)
    return app_consumers
      .replace(/XXX_APP_NAME_XXX/g, appData.name)
  }

  models_py(appid) {
    const appData = store.getters.appData(appid)
    const models = this.get_models(appid)

    var imports = 'from django.db import models\n'
    imports += 'from django.urls import reverse\n'

    var models_py = ''
    models.forEach((model) => {

      models_py += '\n\n'

      if (model.parents && model.parents.length > 0) {
        const parents = model.parents.map(((parent) => {
          if (parent.type == 'user') {
            const model = store.getters.modelData(parent.model)
            return model.name
          } else if (parent.type == 'django') {
            return parent.class.split(".").pop()
          }
        }))

        models_py += 'class ' + model.name + '(' + parents.join(", ") + '):\n\n'
      } else {
        models_py += 'class ' + model.name + '(models.Model):\n\n'
      }

      if (model.relationships && keys(model.relationships).length > 0) {
        models_py += '    # Relationships\n'
        for ( var relationship in model.relationships ) {
          const rData = store.getters.relationships()[relationship].data()
          // e.g. If a built in model, convert django.contrib.auth.models.User to auth.User else just use app.Model
          const builtIn = django.builtInModel(rData.to)
          if (builtIn !== undefined) {
            models_py += '    ' + rData.name + ' = models.' + rData.type.split('.').pop() + '("' + builtIn.app + '"'
          } else {
            models_py += '    ' + rData.name + ' = models.' + rData.type.split('.').pop() + '("' + rData.to + '"'
          }
          if (rData.args) {
            models_py += ', ' + rData.args
          }
          models_py += ')\n'
        }
        models_py += '\n'
      }

      if (model.fields && keys(model.fields).length > 0) {
        models_py += '    # Fields\n'
        for( var field in model.fields ) {
          const f = store.getters.fields()[field]
          if (f) {
            const fData = f.data()
            models_py += '    ' + fData.name + ' = models.' + fData.type.split('.').pop() + '(' + fData.args + ')\n'
          } else {
            models_py += '    ' + 'UNKNOWN' + ' = models.' + 'UNKNOWN' + '(' + 'UNKNOWN'+ ')\n'
          }
        }
        models_py += '\n'
      }

      // TODO - ordering
      // TODO - id field
      models_py += '    class Meta:\n'
      if (model.abstract) {
        models_py += '        abstract = True\n'
      } else {
        models_py += '        pass\n'
      }

      const {identifier} = this.get_identifier(model)

      models_py += '\n'
      models_py += '    def __str__(self):\n'
      models_py += '        return str(self.' + this.get_str(model) + ')\n'
      models_py += '\n'

      models_py += '    def get_absolute_url(self):\n'
      models_py += '        return reverse("' + appData.name + '_' + model.name + '_detail", args=(self.' + identifier + ',))\n'

      models_py += '\n'

      models_py += '    def get_update_url(self):\n'
      models_py += '        return reverse("' + appData.name + '_' + model.name + '_update", args=(self.' + identifier + ',))\n'

    })
    if (models.length === 0){
      models_py += '# No models in this app'
    }

    return imports + models_py
  }

  views_py(appid) {
    const models = this.get_models(appid).filter((modelData)=> {
      // Do not include abstract models in form views
      return !modelData.abstract
    })

    let views = 'from django.views import generic\n'
    views += 'from . import models\n'
    views += 'from . import forms\n'

    models.forEach((model) => {
      const {identifier} = this.get_identifier(model)
      const viewtypes = ['List', 'Create', 'Detail', 'Update']
      viewtypes.forEach((viewtype) => {
        views += '\n\n'
        views += 'class ' + model.name + viewtype + 'View(generic.' + viewtype + 'View):\n'
        views += '    model = models.' + model.name + '\n'
        views += '    form_class = forms.' + model.name + 'Form\n'
        if (identifier !== 'pk' && viewtype === 'Detail' || viewtype === 'Update') {
          if (identifier === 'slug') {
            views += '    slug_url_kwarg = "' + identifier + '"\n'
          } else {
            views += '    pk_url_kwarg = "' + identifier + '"\n'
          }
        }
      })
    })
    return views
  }

  readable_fields(fields) {
    return fields.filter((field) => {
      return django.auto_types.indexOf(field.type) == -1
          && field.args.indexOf('readonly')==-1
          && field.args.indexOf('editable')==-1
          && field.args.indexOf('auto_now_add')==-1
          && field.type != 'django.contrib.contenttypes.fields.GenericForeignKey'
    })
  }

  get_form_fields(fields, relationships) {
    const readable_fields = this.readable_fields(fields)
    var readable_field_names = readable_fields.map((field) => field.name)
    var rels = relationships.map((relationship) => relationship.name)
    return readable_field_names.concat(rels)
  }

  forms_py(appid) {
    const models = this.get_models(appid).filter((modelData)=> {
      // Do not include abstract models in forms
      return !modelData.abstract
    })

    let forms = 'from django import forms'
    forms += '\nfrom . import models'

    models.forEach((model) => {
      forms += '\n\n'
      const fields = this.get_fields(model)
      const relationships = this.get_relationships(model)
      const form_fields = this.get_form_fields(fields, relationships)

      forms += '\nclass ' + model.name + 'Form(forms.ModelForm):\n'
      forms += '    class Meta:\n'
      forms += '        model = models.' + model.name + '\n'
      if (form_fields.length) {
        forms += '        fields = [\n'
        form_fields.forEach((form_field) => {
          forms += '            "' + form_field + '",\n'
        })
        forms += '        ]'
      } else {
        forms += '        fields = []\n'
      }
    })

    forms += '\n'

    return forms
  }

  test_helpers_py(projectid) {
    const apps = this.get_apps(projectid)

    let imports = 'import random\n'
    imports += 'import string\n'
    imports += '\n'

    keys(django.builtInModels).forEach((model) => {
      const [head, ...tail] = model.split('.').reverse()
      imports += 'from ' + tail.reverse().join(".") + ' import '+ head + '\n'
    })

    var test_helpers = '\n'

    apps.forEach((app) => {
      test_helpers += 'from ' + app.name + ' import models as ' + app.name + '_models\n'
    })

    test_helpers += '\n\n'
    test_helpers += 'def random_string(length=10):\n'
    test_helpers += '    # Create a random string of length length\n'
    test_helpers += '    letters = string.ascii_lowercase\n'
    test_helpers += '    return "".join(random.choice(letters) for i in range(length))\n'
    test_helpers += '\n\n'

    keys(django.builtInModels).forEach((model) => {
      const [head] = model.split('.').reverse()
      const modelData = django.builtInModels[model]
      test_helpers += 'def create_' + model.split('.').pop() + '(**kwargs):\n'
      test_helpers += '    defaults = {\n'
      keys(modelData.fields).forEach((field) => {
        const default_value = modelData.fields[field].default
        test_helpers += '        "' + field + '": "%s_' + default_value + '" % random_string(5),\n'
      })
      test_helpers += '    }\n'
      test_helpers += '    defaults.update(**kwargs)\n'
      test_helpers += '    return ' + head + '.objects.create(**defaults)\n'
      test_helpers += '\n\n'
    })

    const extra_imports = new Set()

    apps.forEach((app) => {
      const models = this.get_models(app.id).filter((modelData)=> {
        return !modelData.abstract
      })
      models.forEach((model) => {
        const parent_user_models = []
        const parent_django_models = []

        model.parents.forEach((parent) => {
          if (parent.type == 'user') {
            const model = store.getters.modelData(parent.model)
            parent_user_models.push(model)
          } else if (parent.type == 'django') {
            parent_django_models.push(parent.class)
          }
        })

        const readable_fields = this.readable_fields(this.get_fields(model))
        const relationships = this.get_relationships(model)

        test_helpers += 'def create_' + app.name + '_' + model.name + '(**kwargs):\n'
        test_helpers += '    defaults = {}\n'

        readable_fields.forEach((field) => {
          const default_value = django.fieldDefault(field.type)
          if (default_value && default_value.indexOf('datetime') !== -1 ) {
            extra_imports.add('datetime.datetime')
            test_helpers += '    defaults["' + field.name + '"] = ' + default_value + '\n'
          } else {
            test_helpers += '    defaults["' + field.name + '"] = ""\n'
          }
        })

        parent_user_models.forEach((parent_user_model) => {
          this.get_fields(parent_user_model).forEach((field) => {
            const default_value = django.fieldDefault(field.type)
            if (default_value.indexOf('datetime') !== -1 ) {
              extra_imports.add('datetime.datetime')
            }
            test_helpers += '    defaults["' + field.name + '"] = ' + default_value + '\n'
          })
        })

        parent_django_models.forEach((parent_django_model) => {
          const fields = django.builtInModels[parent_django_model].fields
          keys(fields).forEach((field) => {
            test_helpers += '    defaults["' + field + '"] = "' + fields[field].default + '"\n'
          })
        })

        relationships.forEach((relationship) => {
          var creator = django._builtInModels[relationship.to] ?
            'create_' + relationship.to.split('.').pop():
            'create_' + relationship.to.replace(/\./g, '_')
          test_helpers += '    if "' + relationship.name + '" not in kwargs:\n'
          test_helpers += '        defaults["' + relationship.name + '"] = ' + creator + '()\n'
        })

        test_helpers += '    defaults.update(**kwargs)\n'
        test_helpers += '    return ' +app.name + '_models.' + model.name + '.objects.create(**defaults)\n';
      })
    })

    extra_imports.forEach((im) => {
      const [head, ...tail] = im.split('.').reverse()
      imports += 'from ' + tail.reverse().join('.') + ' import ' + head + '\n'
    })

    return imports + test_helpers
  }

  test_views_py(appid) {
    const appData = store.getters.appData(appid)

    var tests = ''
    tests += 'import pytest\n'
    tests += 'import test_helpers\n'
    tests += '\n'
    tests += 'from django.urls import reverse\n'
    tests += 'from django.test import Client\n'

    // Not yet required
    // tests += 'from ' + appData.name + ' import models\n'

    tests += '\n\n'
    tests += 'pytestmark = [pytest.mark.django_db]\n'

    const models = this.get_models(appid).filter((modelData)=> {
      return !modelData.abstract
    })
    models.forEach((model) => {
      tests += '\n\n'

      const readable_fields = this.readable_fields(this.get_fields(model))
      const relationships = this.get_relationships(model)
      const {identifier} = this.get_identifier(model)

      tests += 'def tests_'+ model.name + '_list_view():\n'
      tests += '    instance1 = test_helpers.create_'+ appData.name + '_' + model.name + '()\n'
      tests += '    instance2 = test_helpers.create_'+ appData.name + '_' + model.name + '()\n'
      tests += '    client = Client()\n'
      tests += '    url = reverse("' + appData.name + '_'+ model.name + '_list")\n'
      tests += '    response = client.get(url)\n'
      tests += '    assert response.status_code == 200\n'
      tests += '    assert str(instance1) in response.content.decode("utf-8")\n'
      tests += '    assert str(instance2) in response.content.decode("utf-8")\n'
      tests += '\n'
      tests += '\n'
      tests += 'def tests_'+ model.name + '_create_view():\n'
      relationships.forEach((relationship) => {
        var creator = django._builtInModels[relationship.to] ?
          'create_' + relationship.to.split('.').pop():
          'create_' + relationship.to.replace(/\./g, '_')
        tests += '    ' + relationship.name + ' = test_helpers.' + creator + '()\n'
      })
      tests += '    client = Client()\n'
      tests += '    url = reverse("' + appData.name + '_'+ model.name + '_create")\n'
      tests += '    data = {\n'
      readable_fields.forEach((field) => {
        const default_value = django.fieldDefault(field.type)
        tests += '        "' + field.name + '": ' + default_value + ',\n'
      })
      relationships.forEach((relationship) => {
        tests += '        "' + relationship.name + '": ' + relationship.name + '.pk,\n'
      })
      tests += '    }\n'
      tests += '    response = client.post(url, data)\n'
      tests += '    assert response.status_code == 302\n'
      tests += '\n'
      tests += '\n'

      tests += 'def tests_'+ model.name + '_detail_view():\n'
      tests += '    client = Client()\n'
      tests += '    instance = test_helpers.create_'+ appData.name + '_' + model.name + '()\n'
      tests += '    url = reverse("' + appData.name + '_'+ model.name + '_detail", args=[instance.' + identifier + ', ])\n'
      tests += '    response = client.get(url)\n'
      tests += '    assert response.status_code == 200\n'
      tests += '    assert str(instance) in response.content.decode("utf-8")\n'
      tests += '\n'
      tests += '\n'
      tests += 'def tests_'+ model.name + '_update_view():\n'
      relationships.forEach((relationship) => {
        var creator = django._builtInModels[relationship.to] ?
          'create_' + relationship.to.split('.').pop():
          'create_' + relationship.to.replace(/\./g, '_')
        tests += '    ' + relationship.name + ' = test_helpers.' + creator + '()\n'
      })
      tests += '    client = Client()\n'
      tests += '    instance = test_helpers.create_'+ appData.name + '_' + model.name + '()\n'
      tests += '    url = reverse("' + appData.name + '_'+ model.name + '_update", args=[instance.' + identifier + ', ])\n'
      tests += '    data = {\n'
      readable_fields.forEach((field) => {
        const default_value = django.fieldDefault(field.type)
        tests += '        "' + field.name + '": ' + default_value + ',\n'
      })
      relationships.forEach((relationship) => {
        tests += '        "' + relationship.name + '": ' + relationship.name + '.pk,\n'
      })
      tests += '    }\n'
      tests += '    response = client.post(url, data)\n'
      tests += '    assert response.status_code == 302\n'
    })
    return tests
  }

  as_tarball(projectid) {
    const tarball = new Tarball()
    const project = store.getters.projectData(projectid)

    keys(project.apps).forEach((app) => {
      const appData = store.getters.appData(app)
      this.app_renderers().forEach((renderer) => {
        const content = this.app_render(renderer, app)
        const path = project.name + '/' + appData.name + '/' + renderer
        tarball.append(path, content)
      })
      tarball.append(
        project.name + '/' + appData.name + '/__init__.py',
        this.init(this.id)
      )
      this.test_renderers().forEach((renderer) => {
        const content = this.test_render(renderer, app)
        const path = project.name + '/tests/' + appData.name + '/' + renderer
        tarball.append(path, content)
      })

      if (project.channels === true) {
        this.channels_app_renderers().forEach((renderer) => {
          const content = this.channels_app_render(renderer, app)
          const path = project.name + '/' + appData.name + '/' + renderer
          tarball.append(path, content)
        })
      }

      this.template_renderers().forEach((renderer) => {
        keys(project.apps).map((app) => {
          const appData = store.getters.appData(app)
          keys(appData.models).map((modelid) => {
            const modelData = store.getters.modelData(modelid)
            const content = this.template_render(renderer, app, modelid)
            const path = project.name + '/' + appData.name + '/templates/' + appData.name + '/' + modelData.name.toLowerCase() + '_' + renderer
            tarball.append(path, content)
          })
        })

      })
      tarball.append(
        project.name + '/tests/' + appData.name + '/__init__.py',
        this.init(this.id)
      )
    })

    if (project.channels === true) {
      this.channels_renderers().forEach((renderer) => {
        const content = this.channels_render(renderer, projectid)
        const path = project.name + '/' + project.name + '/' + renderer
        tarball.append(path, content)
      })
    }

    this.project_renderers().forEach((renderer) => {
      const content = this.project_render(renderer, projectid)
      const path = project.name + '/' + project.name + '/' + renderer
      tarball.append(path, content)
    })

    tarball.append(
      project.name + '/tests/__init__.py', this.init(this.id)
    )

    this.root_template_renderers().forEach((renderer) => {
      const content = this.root_template_render(renderer, projectid)
      const path = project.name + '/templates/' + renderer
      tarball.append(path, content)
    })

    this.root_renderers().forEach((renderer) => {
      const content = this.root_render(renderer, projectid)
      const path = project.name + '/' + renderer
      tarball.append(path, content)
    })

    return tarball.get_url()
  }
}

export default Renderer
