import Renderer from "./django/rendering"
import fs from 'fs';

class Colors {
  static Reset = "\x1b[0m";
  static Bright = "\x1b[1m"
  static Dim = "\x1b[2m"
  static Underscore = "\x1b[4m"
  static Blink = "\x1b[5m"
  static Reverse = "\x1b[7m"
  static Hidden = "\x1b[8m"

  static FgBlack = "\x1b[30m"
  static FgRed = "\x1b[31m"
  static FgGreen = "\x1b[32m"
  static FgYellow = "\x1b[33m"
  static FgBlue = "\x1b[34m"
  static FgMagenta = "\x1b[35m"
  static FgCyan = "\x1b[36m"
  static FgWhite = "\x1b[37m"

  static BgBlack = "\x1b[40m"
  static BgRed = "\x1b[41m"
  static BgGreen = "\x1b[42m"
  static BgYellow = "\x1b[43m"
  static BgBlue = "\x1b[44m"
  static BgMagenta = "\x1b[45m"
  static BgCyan = "\x1b[46m"
  static BgWhite = "\x1b[47m"
}


function project_data_to_store(project_data) {

  const apps = project_data.apps;

  const appData = {};
  const modelData = {};
  const fields = {};
  const relationships = {};
  
  apps.forEach((app, i) => {
    const singleAppData = {
      name: app.name,
      models: {}
    }
    Object.assign(appData, { [`${i}`]: singleAppData});
    
    app.models.forEach((model) => {
      const singleModelData = {
        ...model,
        parents: model.parents || [],
        fields: {},
        relationships: {},
      }
      singleAppData.models[`${model.name}`] = true
      
      Object.assign(modelData, { [`${model.name}`]: singleModelData});

      model.fields.forEach((field) => {
        const singleFieldData = {
          data: () => {
            return {
              ...field,
              args: field.args || "",
            }
          },
        }
        Object.assign(fields, { [`${field.name}`]: singleFieldData});
        singleModelData.fields[`${field.name}`] = true
      })

      model.relationships.forEach((relationship) => {
        const singleRelationshipData = {
          data: () => {
            return {
              ...relationship,
              to: relationship.to,
            }
          },
        }
        Object.assign(relationships, { [`${relationship.name}`]: singleRelationshipData});
        singleModelData.relationships[`${relationship.name}`] = true
      })

    })
  
  })

  const projectData = {
    ...project_data,
    apps: apps.map((_, i) => { return {  [`${i}`]: true} }),
  }
  
  return {
    getters: {
      projectData: () => projectData,
      appData: (app_id) => appData[app_id],
      modelData: (model_id) => modelData[model_id],
      fields: () => fields,
      relationships: () => relationships,
      ordered_models: () => {
        return Object.values(modelData)
      }
    }
  }
}

export function cli(args) {
  if (args.length != 4){
    console.error(`${Colors.FgRed}Please supply an input json file and output tar file.${Colors.Reset}`)
    console.error(`${Colors.FgRed}Usage: ./bin/django-builder example-project.json output.tar.${Colors.Reset}`)
    return
  }

  const input_file = args[2];
  const output_file = args[3];

  let rawdata = fs.readFileSync(input_file);
  let project_json = JSON.parse(rawdata);

  const store = project_data_to_store(project_json)
  const renderer = new Renderer(store);
  const tar_content = renderer.tarball_content()

  try {
    fs.writeFileSync(output_file, tar_content);
    console.log(`${Colors.FgGreen}File written to ${output_file} ${Colors.Reset}`);  //cyan
  } catch (err) {
    console.error(err);
  }
}