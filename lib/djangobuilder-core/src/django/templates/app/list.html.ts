export const template = `
{{{{raw}}}}
{% extends "base.html" %}
{% block content %}
{% for object in object_list %}
  <div class="m-2">
    <a href="{{ object.get_absolute_url }}">{{ object }}</a>
    <small class="ml-5">
      <a href="{{ object.get_delete_url }}">(Delete)</a>
    </small>
  </div>
{% endfor %}
{{{{/raw}}}}
<div>
  <a class="btn btn-primary" href="{% url '{{ model.app.name }}:{{ model.name }}_create' %}">
  Create a new {{ model.name }}
  </a>
</div>
{% endblock %}
`