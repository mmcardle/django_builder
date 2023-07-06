import Django from '@/django/'
import { DEFAULT_DJANGO_VERSION } from '@/django/'
const django = new Django()

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
      {text: "Django 4", value: 4},
      {text: "Django 3", value: 3},
      {text: "Django 2", value: 2},
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
    placeholder: "app_name",
    label: "Application Name (This will be the importable python name for your app)",
    name: "name",
    required: true,
    nospaces: true
  }
]

const model = () => [
  {
    fieldType: "TextInput",
    placeholder: "ModelNameHere",
    label: "Model Name (Used in code + templates; CamelCase recommended)",
    name: "name",
    required: true,
    nospaces: true
  },
  {
    fieldType: "SelectListObjects",
    name: "parents",
    multi: true,
    label: "Parent Models",
    options: django.parentModelTypes
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
    placeholder: "field_name_here",
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
    options: django.fieldTypes,
    required: true,
    updated: (form, field, value) => {
      if (field === "type") {
        const default_val = django.fieldTypes[value].default_args
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
    label: "Relatonship To",
    options: django.builtInModels,
    required: true
  },
  {
    fieldType: "SelectList",
    name: "type",
    multi: false,
    label: "Relatonship Type",
    options: django.relationshipTypes,
    required: true,
    updated: (form, field, value) => {
      if (field === "type") {
        const default_val = django.relationshipTypes[value].default_args
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
