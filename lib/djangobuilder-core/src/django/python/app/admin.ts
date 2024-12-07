export const template = `from django.contrib import admin
from django import forms

from . import models


{{#app.models}}
{{^abstract}}
class {{name}}AdminForm(forms.ModelForm):

    class Meta:
        model = models.{{name}}
        fields = "__all__"


class {{name}}Admin(admin.ModelAdmin):
    form = {{name}}AdminForm
    list_display = [
        {{#fields}}
        "{{name}}",
        {{/fields}}
        {{#relationships}}
        {{#isNotManyToMany .}}
        "{{name}}",
        {{/isNotManyToMany}}
        {{/relationships}}
    ]
    readonly_fields = [
        {{#fields}}
        "{{name}}",
        {{/fields}}
        {{#relationships}}
        "{{name}}",
        {{/relationships}}
    ]
{{/abstract}}
{{/app.models}}


{{#app.models}}
{{^abstract}}
admin.site.register(models.{{name}}, {{name}}Admin)
{{/abstract}}
{{/app.models}}

`
