#!/usr/bin/env node
import DjangoProject, { 
  DjangoApp,
  DjangoModel,
  AuthUser,
  FieldTypes,
  RelationshipType,
  RelationshipTypes,
  BuiltInModel,
  BuiltInModelTypes
} from './api';
import Renderer from './rendering';
import { DjangoVersion } from './types';

const args = process.argv.slice(2);

console.log("ARGS", args);

if (args.length === 0) {
  console.error('No arguments provided.');
  process.exit(1);
}

const command = args[0];

switch (command) {
  case 'render':
    if (args.length < 2) {
      console.error('No template provided for rendering.');
      process.exit(1);
    }
    if (args.length < 3) {
      console.error('No outputfile provided.');
      process.exit(1);
    }
    const input_file = args[1];
    const output_file = args[2];
    const projectData = JSON.parse(require('fs').readFileSync(input_file, 'utf8'));
    
    const projectParams = {
      channels: projectData.channels || false,
      htmx: projectData.htmx || false,
      postgres: projectData.postgres || false,
      pillow: projectData.pillow || false,
    }
    const project = new DjangoProject(
      projectData.name,
      projectData.description,
      projectData.version || DjangoVersion.DJANGO4,
      projectParams,
    );
    
    for (const appData of projectData["apps"]) {

      const djangoApp = new DjangoApp(project, appData.name);

      const models = appData.models.map((modelData: any) => {
        const model = new DjangoModel(djangoApp, modelData.name, false, []);
        modelData.fields.forEach((field: any) => {
          console.log("Adding field", field);
          const fieldType = FieldTypes[field.type];
          if (!fieldType) {
            throw new Error(`Unsupported field type ${field.type}`);
          }
          model.addField(field.name, fieldType, field.args);
        })
        modelData.relationships.forEach((relationshipData: any) => {
          let to: BuiltInModel = BuiltInModelTypes[relationshipData.to];
          if (!to) {
            throw new Error(`Unsupported relationship to ${relationshipData.to}`);
          }
          let relType: RelationshipType = RelationshipTypes[relationshipData.type];
          if (!relType) {
            throw new Error(`Unsupported relationship type ${relationshipData.type}`);
          }
          model.addRelationship(relationshipData.name, relType, to, relationshipData.args);
        })
        return model;
      });

      project.addApp(appData.name, models);
    }
    console.log("Created Project", project);
    const renderer = new Renderer();
    const tarballContent = renderer.tarballContent(project);
    // write to file
    require('fs').writeFileSync(output_file, tarballContent);
    console.log(`Rendered project to ${output_file}`);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}