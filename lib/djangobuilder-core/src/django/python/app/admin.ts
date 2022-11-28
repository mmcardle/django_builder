export const template = `
from django.contrib import admin
from django import forms

from . import models


{{#app.models}}
class {{name}}AdminForm(forms.ModelForm):

    class Meta:
        model = models.{{name}}
        fields = "__all__"


class {{name}}Admin(admin.ModelAdmin):
    form = {{name}}AdminForm
    list_display = [
        {{#fields}}
        '{{name}}',
        {{/fields}}
        {{#relationships}}
        '{{name}}',
        {{/relationships}}
    ]
    readonly_fields = [
        {{#fields}}
        '{{name}}',
        {{/fields}}
        {{#relationships}}
        '{{name}}',
        {{/relationships}}
    ]
{{/app.models}}


{{#app.models}}
admin.site.register(models.{{name}}, {{name}}Admin)
{{/app.models}}

`
