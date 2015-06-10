from django.contrib import admin
from django import forms
from .models import AModel
from .forms import AModelForm



class AModelAdminForm(forms.ModelForm):

    class Meta:
        model = AModel


class AModelAdmin(admin.ModelAdmin):
    form = AModelAdminForm
    list_display = ['slug', 'created', 'last_updated']
    readonly_fields = ['slug', 'created', 'last_updated']

admin.site.register(AModel, AModelAdmin)
