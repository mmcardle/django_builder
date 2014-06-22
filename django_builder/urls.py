from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView, RedirectView
from django.contrib import admin
from django.conf import settings
from django.contrib.auth.views import login
from django.conf.urls.static import static

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', TemplateView.as_view(template_name="index.html"), name='home'),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    # url(r'^admin_tools/', include('admin_tools.urls')),
    url(r'^builder/', include('builder.urls')),
    url(r'^builder_app/$', TemplateView.as_view(template_name="builder.html"), name='bapp_home'),
    url(r'^builder_app/*', RedirectView.as_view(url='/builder_app/'), name='bapp'),

    # Auth
    #url(r"^accounts/", include("django.contrib.auth.urls")),
    #url(r'^accounts/profile/$', TemplateView.as_view(template_name="accounts/profile.html"), name='profile'),
)

if settings.DEBUG:
    urlpatterns += patterns("",
        url(r"", include("django.contrib.staticfiles.urls")),
    ) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)