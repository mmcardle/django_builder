import {
  BuiltInModelTypes,
  DjangoModel,
  DjangoProject,
  DjangoVersion,
  FieldTypes,
  RelationshipTypes,
} from "@djangobuilder/core";
import type { LocalProject } from "./types";

function toDjangoVersion(v: 3 | 4 | 5): DjangoVersion {
  if (v === 3) return DjangoVersion.DJANGO3;
  if (v === 4) return DjangoVersion.DJANGO4;
  return DjangoVersion.DJANGO5;
}

/** Convert editable local state into a generation-ready core DjangoProject. */
export function buildCoreProject(project: LocalProject): DjangoProject {
  const core = new DjangoProject(
    project.name,
    project.description,
    toDjangoVersion(project.djangoVersion),
    { htmx: project.htmx, channels: project.channels, postgres: project.postgres },
    project.id,
  );

  const modelIndex = new Map<string, DjangoModel>();

  // Pass 1: apps, models, fields (relationship targets must exist first).
  for (const app of project.apps) {
    const coreApp = core.addApp(app.name, [], app.id);
    for (const model of app.models) {
      const coreModel = coreApp.addModel(model.name, model.abstract, [], [], [], model.id);
      for (const field of model.fields) {
        const fieldType = FieldTypes[field.type];
        if (!fieldType) throw new Error(`Unknown field type: ${field.type}`);
        const editable = field.args.indexOf("editable=False") === -1;
        coreModel.addField(field.name, fieldType, field.args, editable, field.id);
      }
      modelIndex.set(`${app.name}.${model.name}`, coreModel);
    }
  }

  // Pass 2: relationships.
  for (const app of project.apps) {
    const coreApp = core.apps.find((a) => a.name === app.name)!;
    for (const model of app.models) {
      const coreModel = coreApp.models.find((m) => m.name === model.name)!;
      for (const rel of model.relationships) {
        const relType = RelationshipTypes[rel.type];
        if (!relType) throw new Error(`Unknown relationship type: ${rel.type}`);
        const target =
          rel.to === "auth.User" ? BuiltInModelTypes["auth.User"] : modelIndex.get(rel.to);
        if (!target) throw new Error(`Unknown relationship target: ${rel.to}`);
        coreModel.addRelationship(
          rel.name,
          relType,
          target as Parameters<DjangoModel["addRelationship"]>[2],
          rel.args,
          rel.id,
        );
      }
    }
  }

  return core;
}
