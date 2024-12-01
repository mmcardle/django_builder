export const template = `
{% load static %}
<html>
  <head>
    <title>Django Builder - {{project.name}}</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
    integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    
    {% block extrahead %}{% endblock %}
  </head>
  <body>
    {% block allcontent %}
    <div id="content" class="container">
      <h2>Home: <a href="{% url 'index' %}">{{project.name}}</a></h2>
      <div class="card">
        <div class="card-body">
          <p class="card-text">{% block content %}{% endblock %}</p>
        </div>
      </div>
    </div>
    {{#project.channels}}
    <div class="container mt-3">
      <div class="card">
      <div class="card-body">
          <h5 class="card-title">WebSocket Messages</h5>
          <p class="card-text"><code id="messages"></code></p>
      </div>
    </div>
    {{/project.channels}}
</div>
{{#project.channels}}
<script>
    var wsprotocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://'
    var ws = wsprotocol + window.location.hostname + ':' + window.location.port + '/ws/'
    var socket = new WebSocket(ws);

    socket.onopen = function() {
      // Web Socket is connected, send some text
      socket.send("Text from Javascript");
      // Send some binary data
      socket.send(new Blob(["Bytes from Javascript"]));
    };

    socket.onmessage = function (evt) { 
      console.log(evt)
      var received_msg = evt.data;
      console.log("Message received...", received_msg);
      var node = document.createElement("div");
      if (received_msg instanceof Blob) {
        received_msg.text().then(function (received_text) {
          var textnode = document.createTextNode("> " + received_text);
          node.appendChild(textnode);
          document.getElementById("messages").appendChild(node);
        })
      } else {
        var textnode = document.createTextNode("> " + received_msg);
        node.appendChild(textnode);
        document.getElementById("messages").appendChild(node);
      }
    };
  </script>
  {{/project.channels}}
  {% endblock %}
  </body>
</html>
`