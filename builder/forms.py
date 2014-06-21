__author__ = 'mm'

from django import forms
from .models import AModel
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit


class AModelForm(forms.ModelForm):
    class Meta:
        model = AModel
        fields = ['name',]

    @property
    def helper(self):
        helper = FormHelper()
        helper.form_id = 'AModel-form'
        helper.form_class = 'AModel-form'
        helper.add_input(Submit('save', 'Save'))
        return helper
