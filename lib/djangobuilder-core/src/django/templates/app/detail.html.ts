export const template = `
{% extends "base.html" %}
{% load static %}
{% block content %}
    
<p>
    <a class="btn btn-light" href="{% url '{{model.app.name}}_{{model.name}}_list' %}">
    {{name}} Listing
    </a>
</p>
    
<table class="table">
    <tr><td>Detail</td><td>{{{{raw}}}}{{ object }}{{{{/raw}}}}</td></tr>
    {{#model.fields}}
    <tr>
        <td>{{name}}</td>
        <td>
            {{ object name }}
        </td>
    </tr>
    {{/model.fields}}

</table>
<a class="btn btn-primary" href="{{{{raw}}}}{{object.get_update_url}}{{{{/raw}}}}">Edit</a>

{% endblock %}
`