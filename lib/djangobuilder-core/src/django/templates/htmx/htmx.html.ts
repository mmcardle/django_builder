export const template = `
{% extends "base.html" %}
{% block extrahead %}
<script src="https://unpkg.com/htmx.org@1.8.4"></script>
<script>
  htmx.config.useTemplateFragments = true;
</script>
{% endblock %}
{% block allcontent %}
<div id="content" class="container">
  <h2>Home: <a href="{% url 'index' %}">{{project.name}}</a></h2>
  <div class="container">
    <div class="row">
    {{#project.apps}}
    {{#models}}
    <div class="col col-lg-6">
      <h5>Add A {{name}}</h5>
      <div hx-get="{% url '{{app.name}}_{{name}}_htmx_create' %}" hx-trigger="load" hx-swap="outerHTML"></div>
      <h4>{{name}} List</h4>
      <div hx-get="{% url '{{app.name}}_{{name}}_htmx_list' %}" hx-trigger="load">
      </div>
    </div>
    {{/models}}
    {{/project.apps}}
    </div>
  </div>
</div>
{% endblock %}
`