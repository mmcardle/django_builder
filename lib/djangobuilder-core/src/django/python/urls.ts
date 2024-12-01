export const template = `
"""
{{project.name}} URL Configuration

The 'urlpatterns' list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/{{project.version}}/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html'), name='index'),
    {{#project.apps}}
    path('{{name}}/', include('{{name}}.urls')),
    {{/project.apps}}
    {{#project.htmx}}
    path('htmx/', views.htmx_home, name='htmx'),
    {{/project.htmx}}
    path('admin/', admin.site.urls),
]
`