export const template = `
{{{{raw}}}}
<form hx-post="{{ create_url }}" hx-headers='{"X-CSRFToken": "{{ csrf_token }}"}'>
  {{ form.as_div }}
  <button type="submit">Add</button>
</form>
{{{{/raw}}}}
`