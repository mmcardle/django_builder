from channels import Group


# Connected to websocket.connect
def ws_job_connect(message, group_id):
    message.reply_channel.send({"accept": True})
    Group(group_id).add(message.reply_channel)


# Connected to websocket.receive
def ws_message(message, group_id):
    Group(group_id).send({
        "text": "%s" % message.content['text'],
    })


# Connected to websocket.disconnect
def ws_disconnect(message, group_id):
    Group(group_id).discard(message.reply_channel)
