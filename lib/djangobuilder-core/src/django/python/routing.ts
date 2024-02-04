export const template = `
from django.conf.urls import url

from channels.routing import ChannelNameRouter, ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from {{project.name}}.consumers import {{project.name}}_WebSocketConsumer

{{#project.apps}}
from {{name}}.consumers import {{ camelCase name }}Consumer
{{/project.apps}}

application = ProtocolTypeRouter({

    # WebSocket handler
    "websocket": AuthMiddlewareStack(
        URLRouter([
            url(r"^ws/$", XXX_PROJECT_NAME_XXX_WebSocketConsumer.as_asgi()),
        ])
    ),
    "channel": ChannelNameRouter({
    {{#project.apps}}
        "{{name}}": {{ camelCase name }}Consumer,
    {{/project.apps}}
    })
})
`