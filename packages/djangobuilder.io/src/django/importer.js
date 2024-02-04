import Django from '@/django/'


class ModelImporter {

  constructor() {
    this.django = new Django()
  }

  import_models (files) {
    const promises = []

    for (var i = 0; i < files.length; i++) {
      promises.push(this.parse_file(files.item(i)))
    }

    return Promise.all(promises).then((results) => {
      return results
    })
  }

  parse_file (file) {

    const that = this
    const fieldTypes = Object.keys(that.django.fieldTypes)
    const relationshipTypes = Object.keys(that.django.relationshipTypes)

    const filePromise = new Promise((resolve) => {
      console.debug('parsing file', file)
      const reader = new FileReader()
      reader.onload = function () {
        var text = reader.result
        var lines = text.split('\n')
        var model_definitions = []
        var parsing_meta = false
        var current_model = null
        var multi_line = ''

        const model_regex = new RegExp("class(\\s*)(?<modelName>[a-zA-Z_0-9]*)[(](?<modelType>[a-zA-Z._]*)[)][:]$")
        const field_regex = new RegExp("^(?<name>[a-zA-Z0-9_]+)(\\s*)=(\\s*)(?<type>[a-zA-Z0-9._]+)[(](?<opts>.*)[)]$")
        const meta_class_regex = new RegExp("^class(\\s*)Meta:$")
        const meta_regex = new RegExp("^(?<key>[a-zA-Z0-9_]+)(\\s*)=(\\s*)(?<value>[a-zA-Z0-9_]+)$")

        lines.forEach((line) => {
          // console.log('line', line)
          line = line.trim()
          const model_match = model_regex.exec(line)
          if (model_match && model_match.groups['modelType'].match(/model/i)) {
            current_model = {
              name: model_match.groups['modelName'],
              type: model_match.groups['modelType'],
              fields: [],
              relationships: [],
              abstract: false
            }
            model_definitions.push(current_model)
            multi_line = ''
            parsing_meta = false  // no longer parsing meta
          }
          var matched_content
          var field_match = field_regex.exec(line)
          if(field_match){
            matched_content=field_match
          }
          var multi_line_match = field_regex.exec(multi_line)
          if (multi_line_match) {
            matched_content=multi_line_match
          }
          if (matched_content) {
            const name = matched_content.groups['name']
            const type = matched_content.groups['type']
            const opts =  matched_content.groups['opts']
            const is_relationship_field = that.django.relationshipMatches.indexOf(type) != -1

            if (current_model && type && (type.match(/field/i) || is_relationship_field)) {
              if (is_relationship_field) {
                const raw_opts = opts.split(',')
                const rel_to = raw_opts.shift().replace(/['"]+/g, '')
                const rel_opts = raw_opts.join(",").trim()
                const relatonship = {
                  'name': name,
                  'opts': rel_opts,
                  'to': rel_to
                }

                if (relationshipTypes.indexOf('django.db.' + type) != -1) {
                  relatonship['type'] = 'django.db.' + type
                } else {
                  relatonship['type'] = type
                }

                console.log('Model:', current_model.name, 'Relationship:', relatonship )
                current_model.relationships.push(relatonship)
              } else {

                const field = {
                  'name': name,
                  'opts': opts
                }

                if (fieldTypes.indexOf('django.db.' + type) != -1) {
                  field['type'] = 'django.db.' + type
                } else {
                  field['type'] = type
                }

                console.debug('Model:', current_model.name, 'Field:', field)
                current_model.fields.push(field)
              }
            }
            multi_line = ''
          } else if (meta_class_regex.exec(line)) {
            parsing_meta = true
            multi_line = ''
          } else if (parsing_meta && meta_regex.exec(line)) {
            const meta_parameter = meta_regex.exec(line).groups
            if (current_model && that.django.metaParams.indexOf(meta_parameter.key) != -1) {
              current_model[meta_parameter.key] = meta_parameter.value.trim() === "True"
              console.log('Meta:', meta_parameter.key, meta_parameter.value)
              multi_line = ''
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

        console.debug('Model definitions', model_definitions)

        const result = {
          file: file,
          models: model_definitions
        }

        resolve(result)
      }
      reader.readAsText(file);
    })

    return filePromise
  }
}

export default ModelImporter
