

class HTMXXXX__MODEL_NAME__XXXListView(generic.ListView):
    model = models.XXX__MODEL_NAME__XXX
    form_class = forms.XXX__MODEL_NAME__XXXForm
    
    def get(self, request, *args, **kwargs):
        super().get(request, *args, **kwargs)
        return TemplateResponse(
            request,
            f'{self.model._meta.app_label}/htmx/list.html',
            {
                "model_id": self.model._meta.verbose_name_raw,
                "objects": self.get_queryset()
            }
        )


class HTMXXXX__MODEL_NAME__XXXCreateView(generic.CreateView):
    model = models.XXX__MODEL_NAME__XXX
    form_class = forms.XXX__MODEL_NAME__XXXForm
    
    def get(self, request, *args, **kwargs):
        super().get(request, *args, **kwargs)
        context = {
            "create_url": self.model.get_htmx_create_url(),
            "form": self.get_form()
        }
        return TemplateResponse(
            request,
            f'{self.model._meta.app_label}/htmx/form.html',
            context
        )

    def form_valid(self, form):
        super().form_valid(form)
        return TemplateResponse(
            self.request,
            f'{self.model._meta.app_label}/htmx/create.html',
            {
                "model_id": self.model._meta.verbose_name_raw,
                "object": self.object,
                "form": form
            }
        )

    def form_invalid(self, form):
        super().form_invalid(form)
        context = {
            "create_url": self.model.get_htmx_create_url(),
            "form": self.get_form()
        }
        return TemplateResponse(
            self.request,
            f'{self.model._meta.app_label}/htmx/form.html',
            context
        )


class HTMXXXX__MODEL_NAME__XXXDeleteView(generic.DeleteView):
    model = models.XXX__MODEL_NAME__XXX
    success_url = reverse_lazy("app_XXX__MODEL_NAME__XXX_htmx_list")
    
    def form_valid(self, form):
        super().form_valid(form)
        return HttpResponse()