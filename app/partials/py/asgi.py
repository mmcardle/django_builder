import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "___PROJECT_NAME___.settings")

application = get_wsgi_application()
