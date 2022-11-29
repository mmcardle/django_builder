export const template = `
from channels.consumer import SyncConsumer


class {{ camelCase app.name }}Consumer(SyncConsumer):

    def app1_message(self, message):
        # do something with message
        pass
`