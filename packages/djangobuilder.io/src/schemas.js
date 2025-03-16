import {
  DEFAULT_DJANGO_VERSION, ParentModelTypes, FieldTypes, RelationshipTypes, BuiltInModelTypes,
  DjangoVersion
} from "@djangobuilder/core"


const project = () => [
  {
    fieldType: "TextInput",
    placeholder: "This will be the importable python name for your project.",
    label: "Project Name - The name of your project",
    name: "name",
    required: true,
    nospaces: true
  },
  {
    fieldType: "TextInput",
    placeholder: "",
    label: "An optional description for your project.",
    name: "description"
  },
  {
    fieldType: "ButtonGroupSelect",
    name: "django_version",
    label: "Version",
    default_value: DEFAULT_DJANGO_VERSION,
    options: [
      {text: "Django 5", value: DjangoVersion.DJANGO5},
      {text: "Django 4", value: DjangoVersion.DJANGO4},
      {text: "Django 3", value: DjangoVersion.DJANGO3},
    ],
    required: true,
  },
  {
    fieldType: "BooleanInput",
    label: "Include Django Channels in this project.",
    name: "channels",
  },
  {
    fieldType: "BooleanInput",
    label: "Include HTMX in this project.",
    name: "htmx",
  }
]

const app = () => [
  {
    fieldType: "TextInput",
    placeholder: "This will be the importable python name for your app.",
    label: "Application Name",
    name: "name",
    required: true,
    nospaces: true
  }
]

const model = () => [
  {
    fieldType: "TextInput",
    placeholder: "amodel",
    label: "Model Name",
    name: "name",
    required: true,
    nospaces: true
  },
  {
    fieldType: "SelectListObjects",
    name: "parents",
    multi: true,
    label: "Parent Models",
    options: ParentModelTypes
  },
  {
    fieldType: "BooleanInput",
    label: "This is an abstract model.",
    name: "abstract",
  }
]

const field = () => [
  {
    fieldType: "TextInput",
    placeholder: "afield",
    label: "Name",
    name: "name",
    required: true,
    nospaces: true
  },
  {
    fieldType: "SelectList",
    name: "type",
    multi: false,
    label: "Field Type",
    options: FieldTypes,
    required: true,
    updated: (form, field, value) => {
      if (field === "type") {
        const default_val = FieldTypes[value].default_args
        form['args'][0].default_value = default_val
        return {field: "args", value: default_val}
      }
    }
  },
  {
    fieldType: "TextInput",
    placeholder: "args",
    name: "args",
    label: "args",
    required: false
  }
]

const relationship = () => [
  {
    fieldType: "TextInput",
    placeholder: "arelationship",
    label: "Name",
    name: "name",
    required: true,
    nospaces: true
  },
  {
    fieldType: "SelectList",
    name: "to",
    multi: false,
    label: "Relationship To",
    options: BuiltInModelTypes,
    required: true
  },
  {
    fieldType: "SelectList",
    name: "type",
    multi: false,
    label: "Relationship Type",
    options: RelationshipTypes,
    required: true,
    updated: (form, field, value) => {
      if (field === "type") {
        const default_val = RelationshipTypes[value].default_args
        form['args'][0].default_value = default_val
        return {field: "args", value: default_val}
      }
    }
  },
  {
    fieldType: "TextInput",
    placeholder: "args",
    name: "args",
    label: "args",
    required: false
  }
]

const schemas = {
  project: project,
  app: app,
  model: model,
  field: field,
  relationship: relationship,
}

export {schemas, app, model, field, relationship}
