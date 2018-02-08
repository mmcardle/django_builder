from channels.routing import route
from .consumers import ws_message, ws_job_connect, ws_disconnect

channel_routing = [
    route("websocket.connect", ws_job_connect, path=r"^/ws/(?P<group_id>[a-zA-Z0-9_-]+)/$"),  # noqa
    route("websocket.receive", ws_message, path=r"^/ws/(?P<group_id>[a-zA-Z0-9_-]+)/$"),  # noqa
    route("websocket.disconnect", ws_disconnect, path=r"^/ws/(?P<group_id>[a-zA-Z0-9_-]+)/$"),  # noqa
]
