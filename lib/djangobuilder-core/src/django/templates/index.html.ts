export const template = `
{% extends "base.html" %}
{% block content %}

<div class='container'>
  <div class='card'>
    <div class='card-body'>
      {{#project.apps}}
      <div class="m-2">
        <h4>{{name}}</h4>
      </div>
      {{#models}}
      {{^abstract}}
      <div class="m-2">
      <a class="btn btn-light" href="{% url '{{app.name}}:{{name}}_list' %}">{{name}} Listing</a>
      </div>
      {{/abstract}}
      {{/models}}
      {{/project.apps}}
    </div>
  </div>
</div>

{{#project.htmx}}
<div class='container'>
  <div class='card'>
    <div class='card-body'>
      <div>
        <a href="{% url 'htmx' %}">HTMX UI</a>
      </div>
    </div>
  </div>
</div>
{{/project.htmx}}
{% endblock %}
`