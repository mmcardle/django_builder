export const template = `
{% extends "{{model.app.name}}/base.html" %}
{{{{raw}}}}
{% block content %}
<form method="post">
  {% csrf_token %}
  <p>Are you sure you want to delete "{{ object }}"?</p>
  <div>
    <input class="btn btn-danger" value="Delete {{ object }}" type="submit">
  </div>
</form>
{% endblock %}
{{{{/raw}}}}
`