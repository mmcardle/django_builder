export const template = `
from django.urls import path, include
from rest_framework import routers

from . import api
from . import views
{{#app.project.htmx}}
from . import htmx
{{/app.project.htmx}}


router = routers.DefaultRouter()
{{#app.models}}
router.register("{{name}}", api.{{name}}ViewSet)
{{/app.models}}

urlpatterns = (
    path("api/v1/", include(router.urls)),
    {{#app.models}}
    path("{{app.name}}/{{name}}/", views.{{name}}ListView.as_view(), name="{{app.name}}_{{name}}_list"),
    path("{{app.name}}/{{name}}/create/", views.{{name}}CreateView.as_view(), name="{{app.name}}_{{name}}_create"),
    path("{{app.name}}/{{name}}/detail/<int:pk>/", views.{{name}}DetailView.as_view(), name="{{app.name}}_{{name}}_detail"),
    path("{{app.name}}/{{name}}/update/<int:pk>/", views.{{name}}UpdateView.as_view(), name="{{app.name}}_{{name}}_update"),
    path("{{app.name}}/{{name}}/delete/<int:pk>/", views.{{name}}DeleteView.as_view(), name="{{app.name}}_{{name}}_delete"),
    {{#app.project.htmx}}
    path("{{app.name}}/htmx/{{name}}/", htmx.HTMX{{name}}ListView.as_view(), name="{{app.name}}_{{name}}_htmx_list"),
    path("{{app.name}}/htmx/{{name}}/create/", htmx.HTMX{{name}}CreateView.as_view(), name="{{app.name}}_{{name}}_htmx_create"),
    path("{{app.name}}/htmx/{{name}}/delete/<int:pk>/", htmx.HTMX{{name}}DeleteView.as_view(), name="{{app.name}}_{{name}}_htmx_delete"),
    {{/app.project.htmx}}
    {{/app.models}}
)
`
