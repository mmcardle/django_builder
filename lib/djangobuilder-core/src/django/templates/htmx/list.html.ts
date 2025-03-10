export const template = `
{{{{raw}}}}
<table class="table">
  <thead>
      <tr>
          <th>Name</th>
          <th>Actions</th>
      </tr>
  </thead>
  <tbody id="{{ model_id }}-table">
    {% for object in objects %}
    <tr>
      <td>{{ object }}</td>
      <td>
        {% include "./delete_button.html" with object=object %}
      </td>
    <tr>
     {% endfor %}
  </tbody>
</table>
{{{{/raw}}}}
`