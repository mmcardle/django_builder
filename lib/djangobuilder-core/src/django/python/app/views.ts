export const template = `
from django.views import generic
from django.urls import reverse_lazy

from . import models
from . import forms

{{#app.models}}
{{^abstract}}

class {{name}}ListView(generic.ListView):
    model = models.{{name}}
    form_class = forms.{{name}}Form


class {{name}}CreateView(generic.CreateView):
    model = models.{{name}}
    form_class = forms.{{name}}Form


class {{name}}DetailView(generic.DetailView):
    model = models.{{name}}
    form_class = forms.{{name}}Form


class {{name}}UpdateView(generic.UpdateView):
    model = models.{{name}}
    form_class = forms.{{name}}Form
    pk_url_kwarg = "pk"


class {{name}}DeleteView(generic.DeleteView):
    model = models.{{name}}
    success_url = reverse_lazy("{{app.name}}:{{name}}_list")

{{/abstract}}
{{/app.models}}
`
