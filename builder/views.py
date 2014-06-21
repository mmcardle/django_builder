from django.http import HttpResponse
from django.views.generic import DetailView, ListView, UpdateView, CreateView
from .models import AModel
from .forms import AModelForm
import simplejson as json

class AModelListView(ListView):
    model = AModel

    def get(self, request, *args, **kwargs):

        r = json.dumps({
            'name': 'JSONModel'
        })

        return HttpResponse(r, content_type='application/json')


class AModelCreateView(CreateView):
    model = AModel
    form_class = AModelForm


class AModelDetailView(DetailView):
    model = AModel


class AModelUpdateView(UpdateView):
    model = AModel
    form_class = AModelForm
