export const template = `
{{{{raw}}}}
<tbody hx-swap-oob="beforeend:#{{ model_id }}-table">
  <tr>
      <td>{{ object }}</td>
      <td>
      <button hx-post="{{ object.get_htmx_delete_url }}"
          hx-headers='{"X-CSRFToken": "{{ csrf_token }}"}'
          hx-swap='outerHTML'
          hx-target="closest tr"
          type="submit"
        >Delete
      </button>
      </td>
  </tr>
</tbody>

{{ form.as_div }}
<button type="submit">Add</button>
{{{{/raw}}}}
`