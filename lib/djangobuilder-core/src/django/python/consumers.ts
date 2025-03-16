export const template = `
from channels.generic.websocket import WebsocketConsumer


class {{project.name}}WebSocketConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()

    def receive(self, text_data=None, bytes_data=None):
        if text_data:
            print(f"Received text={text_data}")
            self.send(text_data=f"Hello from {{project.name}} WebSocketConsumer! {text_data}")
        if bytes_data:
            print(f"Received bytes={bytes_data}")
            self.send(bytes_data=b"Hello from {{project.name}} WebSocketConsumer! " + bytes_data)

    def disconnect(self, message):
        # Called when disconnected
        pass
`