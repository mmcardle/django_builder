export const template = `
{% extends "base.html" %}
{% load static %}
{% block content %}
    
<p>
    <a class="btn btn-light" href="{% url '{{model.app.name}}_{{model.name}}_list' %}">
    {{name}} Listing
    </a>
</p>
    
<form method="post" enctype="multipart/form-data">
  {% csrf_token %}
  {{{{raw}}}}
  {{form.errors}}
  {{form.as_div}}
  {{{{/raw}}}}
  <input type="submit" value="Save" class="btn btn-primary">
</form>

{% endblock %}
`