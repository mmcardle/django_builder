export const template = `
from django import forms
from . import models
{{#app.models}}
{{#relationships}}
from {{to.importModule}} import {{to.model}}
{{/relationships}}
{{/app.models}}

{{#app.models}}
{{^abstract}}
class {{name}}Form(forms.ModelForm):
    class Meta:
        model = models.{{name}}
        fields = [
            {{#fields}}
            {{#is_editable_field}}
            "{{name}}",
            {{/is_editable_field}}
            {{/fields}}
            {{#relationships}}
            "{{name}}",
            {{/relationships}}
            {{#parents}}
            {{#fields}}
            "{{name}}",
            {{/fields}}
            {{/parents}}
        ]

    def __init__(self, *args, **kwargs):
        super({{name}}Form, self).__init__(*args, **kwargs)
        {{#relationships}}
        self.fields["{{name}}"].queryset = {{to.model}}.objects.all()
        {{/relationships}}
{{/abstract}}
{{/app.models}}
`
