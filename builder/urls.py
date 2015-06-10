__author__ = 'mm'

from django.conf.urls import patterns, url
from .views import AModelDetailView, AModelListView, AModelCreateView, AModelUpdateView


urlpatterns = patterns('builder.views',

    # urls for AModel
    url(r'^amodel/$', AModelListView.as_view(), name='builder_amodel_list'),
    url(r'^amodel/create/$', AModelCreateView.as_view(), name='builder_amodel_create'),
    url(r'^amodel/(?P<slug>\S+)/update/$', AModelUpdateView.as_view(), name='builder_amodel_update'),
    url(r'^amodel/(?P<slug>\S+)/$', AModelDetailView.as_view(), name='builder_amodel_detail'),

)