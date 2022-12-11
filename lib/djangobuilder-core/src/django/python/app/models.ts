export const template = `
from django.db import models
from django.urls import reverse
{{#app.models}}

class {{name}}({{#each parents}}{{name}}{{else}}models.Model{{/each}}):

    {{#relationships}}
    {{name}} = models.{{type}}("{{ relatedTo .}}", {{{args}}})
    {{/relationships}}

    {{#fields}}
    {{name}} = models.{{type}}({{{args}}})
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
