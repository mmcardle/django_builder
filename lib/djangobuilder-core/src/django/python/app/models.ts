export const template = `
import time
import uuid
from datetime import timedelta, datetime, time

from django.db import models
from django.urls import reverse
from django.contrib.postgres import fields as postgres_fields
from django.contrib.postgres.fields import ranges as postgres_range_fields

{{#app.models}}

class {{name}}({{#modelParents parents}}{{/modelParents}}):

    {{#relationships}}
    {{name}} = models.{{type.name}}("{{ relatedTo .}}", {{{args}}})
    {{/relationships}}

    {{#fields}}
    {{name}} = {{ importModule . }}.{{type.name}}({{{args}}})
    {{/fields}}

    class Meta:
        {{#abstract}}abstract = True{{/abstract}}{{^abstract}}pass{{/abstract}}

    {{^abstract}}
    def __str__(self):
        return str(self.{{nameField}})

    @staticmethod
    def get_create_url():
        return reverse("{{app.name}}_{{name}}_create")

    def get_absolute_url(self):
        return reverse("{{app.name}}_{{name}}_detail", args=(self.{{primaryKey}},))

    def get_update_url(self):
        return reverse("{{app.name}}_{{name}}_update", args=(self.{{primaryKey}},))

    def get_delete_url(self):
        return reverse("{{app.name}}_{{name}}_delete", args=(self.{{primaryKey}},))

    {{#app.project.htmx}}
    @staticmethod
    def get_htmx_create_url():
        return reverse("{{app.name}}_{{name}}_htmx_create")

    def get_htmx_delete_url(self):
        return reverse("{{app.name}}_{{name}}_htmx_delete", args=(self.{{primaryKey}},))
    {{/app.project.htmx}}
    {{/abstract}}

{{/app.models}}

`
