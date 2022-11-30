export const template = `
from django import forms
from . import models
{{#app.models}}
{{#relationships}}
#from {{to.import}} import {{to.name}}
{{/relationships}}
{{/app.models}}

{{#app.models}}
{{^abstract}}
class {{name}}Form(forms.ModelForm):
    class Meta:
        model = models.{{name}}
        fields = [
            {{#fields}}
            '{{name}}',
            {{/fields}}
            {{#relationships}}
            '{{name}}',
            {{/relationships}}
            {{#parents}}
            {{#fields}}
            '{{name}}',
            {{/fields}}
            {{/parents}}
        ]

    def __init__(self, *args, **kwargs):
        super({{name}}Form, self).__init__(*args, **kwargs)
        {{#relationships}}
        #self.fields["{{name}}"].queryset = {{to}}.objects.all()
        {{/relationships}}
{{/abstract}}
{{/app.models}}
`
