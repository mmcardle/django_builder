from django.shortcuts import render


def htmx_home(request):
    return render(request, 'htmx/htmx.html')