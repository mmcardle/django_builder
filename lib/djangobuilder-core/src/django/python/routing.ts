export const template = `
from django.urls import re_path

from .consumers import {{project.name}}WebSocketConsumer

websocket_urlpatterns = [
    re_path(r"^ws/$", {{project.name}}WebSocketConsumer.as_asgi()),
]

`