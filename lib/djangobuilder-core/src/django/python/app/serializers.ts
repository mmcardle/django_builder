export const template = `
from rest_framework import serializers
from . import models

{{#app.models}}

class {{name}}Serializer(serializers.ModelSerializer):

    class Meta:
        model = models.{{name}}
        fields = [
            {{#fields}}
            '{{name}}',
            {{/fields}}
            {{#relationships}}
            '{{name}}',
            {{/relationships}}
        ]
{{/app.models}}

`
