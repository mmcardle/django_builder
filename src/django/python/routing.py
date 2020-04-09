from django.conf.urls import url

from channels.routing import ChannelNameRouter, ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from XXX_PROJECT_NAME_XXX.consumers import XXX_PROJECT_NAME_XXX_WebSocketConsumer

XXX_CONSUMER_IMPORTS_XXX

application = ProtocolTypeRouter({

    # WebSocket handler
    "websocket": AuthMiddlewareStack(
        URLRouter([
            url(r"^ws/$", XXX_PROJECT_NAME_XXX_WebSocketConsumer),
        ])
    ),
    "channel": ChannelNameRouter({
    XXX_CONSUMERS_XXX
    })
})
