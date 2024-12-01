import { Exception } from "handlebars"
import {BuiltInModelTypes, DjangoRelationship, ParentModelTypes } from "./api"
import { FieldTypes, RelationshipTypes, DjangoProject, DjangoApp, DjangoModel, DjangoField, DjangoVersion } from "./index"


const relationshipMatches = [
  'ForeignKey',
  'models.ForeignKey',
  'db.models.ForeignKey',
  'OneToOneField',
  'models.OneToOneField',
  'db.models.OneToOneField',
  'ManyToManyField',
  'models.ManyToManyField',
  'db.models.ManyToManyField',
]

const metaParams = ['abstract']

class ModelImporter {

  import_models (models: string[]) {
    const results = []

    for (let i = 0; i < models.length; i++) {
      results.push(this.parse_file(models[i]))
    }

    return results
  }

  parse_file (text: string) {

    const fieldTypes = Object.keys(FieldTypes)
    const relationshipTypes = Object.keys(RelationshipTypes)

    const lines = text.split('\n')
    const model_definitions: DjangoModel[] = []
    const errors: Array<string> = [];
    
    let parsing_meta = false
    let current_model: null | DjangoModel = null
    let multi_line = ''

    const model_regex = /^class(\s*)(?<modelName>[\w]*)\((?<modelType>[\w\W]*)\)[:]$/
    
    const field_regex = new RegExp("^(?<name>[a-zA-Z0-9_]+)(\\s*)=(\\s*)(?<type>[a-zA-Z0-9._]+)[(](?<opts>.*)[)]$")
    const meta_class_regex = new RegExp("^class(\\s*)Meta:$")
    const meta_regex = new RegExp("^(?<key>[a-zA-Z0-9_]+)(\\s*)=(\\s*)(?<value>[a-zA-Z0-9_]+)$")
    
    const dummy_project = new DjangoProject("DummyProject", "", DjangoVersion.DJANGO4)
    const dummy_app = new DjangoApp(dummy_project, "dummy_app")
    const unknown_model = new DjangoModel(dummy_app, "UnknownModel")

    lines.forEach((line) => {
      // console.log('line', line)
      line = line.trim()
      const model_match = model_regex.exec(line)
      if (model_match?.groups && model_match.groups['modelType']) {

        const type = model_match.groups['modelType']

        const parents = [];
        if (ParentModelTypes[type]) {
          parents.push(ParentModelTypes[type])
        } else if (type == "models.Model" || type == "Model") {
          // OK - this is probably a standard Django model
        } else {
          errors.push(`Could not import type ${type}`)
        }

        current_model = new DjangoModel(
          dummy_app,
          model_match.groups['modelName'],
          false,
          [],
          [],
          parents // TODO existing model or built in?
        )
        console.log("Found Model", current_model.name)
        model_definitions.push(current_model)
        multi_line = ''
        parsing_meta = false  // no longer parsing meta
      }
      let matched_content
      const field_match = field_regex.exec(line)
      if (field_match) {
        matched_content = field_match
      }
      const multi_line_match = field_regex.exec(multi_line)
      if (multi_line_match) {
        matched_content=multi_line_match
      }
      if (matched_content?.groups) {
        const name = matched_content.groups['name']
        const type = matched_content.groups['type']
        const opts =  matched_content.groups['opts']
        const is_relationship_field = relationshipMatches.indexOf(type) != -1

        const type_last = type.split(".").reverse().shift()

        if (current_model && type && (type.match(/field/i) || is_relationship_field)) {
          if (is_relationship_field) {
            const raw_opts = opts.split(',')
            const rel_to_shift = raw_opts.shift()
            if (rel_to_shift) {

              const rel_to = rel_to_shift.replace(/['"]+/g, '')
              const rel_opts = raw_opts.join(",").trim()

              //console.log("Found Relationship", type, type_last, rel_to, rel_opts)

              if (type_last && relationshipTypes.indexOf(type_last) != -1) {

                let relationship = null;
                if (BuiltInModelTypes[rel_to]) {
                  relationship = new DjangoRelationship(
                    current_model,
                    name,
                    RelationshipTypes[type_last],
                    BuiltInModelTypes[rel_to],
                    rel_opts,
                  )
                } else {
                  relationship = new DjangoRelationship(
                    current_model,
                    name,
                    RelationshipTypes[type_last],
                    unknown_model,
                    rel_opts,
                  )
                  console.warn("Cant set relationship", relationship, "to", rel_to)
                  errors.push(`Cant set relationship ${relationship.name} to ${rel_to}`)
                }

                console.log("  --  Found Relationship", relationship.name)
                
                //console.log('Model:', current_model.name, 'Relationship:', relationship )
                current_model.relationships.push(relationship)
              } else {
                console.warn("Cant understand relationship ", type)
                errors.push(`Cant understand relationship ${type}`)
              }
              
            }
          } else {

            if (type_last && fieldTypes.indexOf(type_last) != -1) {
              const field = new DjangoField(current_model, name, FieldTypes[type_last], "")
              //console.debug('Model:', current_model.name, 'Field:', field)
              console.log("  --  Found Field", field.name)
              current_model.fields.push(field)
            } else {
              console.warn("Cant understand field", type)
              errors.push(`Cant understand field ${type}`)
            }

          }
        }
        multi_line = ''
      } else if (meta_class_regex.exec(line)) {
        parsing_meta = true
        multi_line = ''
      } else if (parsing_meta && meta_regex.exec(line)) {
        const meta_exec = meta_regex.exec(line);
        if (meta_exec) {
          const meta_parameter = meta_exec.groups
          if (current_model && meta_parameter && metaParams.indexOf(meta_parameter.key) != -1) {
            if (meta_parameter.key === "abstract") {
              current_model.abstract = meta_parameter.value.trim() === "True"
              console.log('  --  Meta:', meta_parameter.key, meta_parameter.value)
              multi_line = ''
            }
          }
        }
      } else {
        /*
        There is no match for this line
        Append to multi_line to try and match
        if we are parsing a model
        */
        if(current_model) {
          multi_line = multi_line + line
        }
      }
    })

    const result = {
      text,
      models: model_definitions,
      errors
    }

    return result
  }
}

export default ModelImporter
