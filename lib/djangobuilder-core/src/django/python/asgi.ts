export const template = `
"""
ASGI entrypoint for {{project.name}}. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os
import django
from channels.routing import get_default_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "{{project.name}}.settings")
django.setup()
application = get_default_application()
`