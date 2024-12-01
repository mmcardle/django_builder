export const template = `
{{^project.htmx}}
# No project views
{{/project.htmx}}
{{#project.htmx}}
from django.shortcuts import render


def htmx_home(request):
    return render(request, 'htmx/htmx.html')
{{/project.htmx}}

`