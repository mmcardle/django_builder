from django.conf import settings

__author__ = 'mm'


def build_context(request):
    return {
        'DEBUG': settings.DEBUG,
    }