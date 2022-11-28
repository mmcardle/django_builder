export const template = `
from channels.consumer import SyncConsumer


class {{app.nameCamelCase}}Consumer(SyncConsumer):

    def app1_message(self, message):
        # do something with message
        pass
`