export const template = `
Django=={{project.version}}
djangorestframework
asgiref
{{#project.channels}}
channels
channels_redis
{{/project.channels}}
{{#project.htmx}}
django-htmx
{{/project.htmx}}
{{#project.postgres}}
psycopg2-binary
sqlparse
{{else}}
pysqlite3
{{/project.postgres}}
{{#project.pillow}}
Pillow
{{/project.pillow}}
`
