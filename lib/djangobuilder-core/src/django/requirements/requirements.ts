export const template = `
Django=={{project.version}}
django-extensions
djangorestframework
{{#project.channels}}
channels
channels_redis
{{/project.channels}}
{{#project.htmx}}
django-htmx
{{/project.htmx}}
`
