export const template = `
from rest_framework import viewsets, permissions
from . import models
from . import serializers


{{#app.models}}
{{^abstract}}
class {{name}}ViewSet(viewsets.ModelViewSet):
    """ViewSet for the {{name}} class"""

    queryset = models.{{name}}.objects.all()
    serializer_class = serializers.{{name}}Serializer
    permission_classes = [permissions.IsAuthenticated]

{{/abstract}}
{{/app.models}}
`
