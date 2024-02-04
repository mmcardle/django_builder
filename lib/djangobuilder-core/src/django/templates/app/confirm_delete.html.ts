export const template = `
{{{{raw}}}}
{% extends "base.html" %}
{% block content %}
<form method="post">
  {% csrf_token %}
  <p>Are you sure you want to delete "{{ object }}"?</p>
  <div>
    <input class="btn btn-danger" value="Delete AnotherModel" type="submit">
  </div>
</form>
{% endblock %}
{{{{/raw}}}}
`