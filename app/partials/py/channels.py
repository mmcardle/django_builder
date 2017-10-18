# Channels
# https://channels.readthedocs.io/en/stable/getting-started.html
CHANNEL_LAYERS = {
    "default": {
        "ROUTING": "___PROJECT_NAME___.routing.channel_routing",

        # Dev Config
        "BACKEND": "asgiref.inmemory.ChannelLayer",

        # Production Config using REDIS
        # "BACKEND": "asgi_redis.RedisChannelLayer",
        # "CONFIG": {
        #    "hosts": [("redis", 6379)],
        # },
    },
}

INSTALLED_APPS += [
    'channels'
]
