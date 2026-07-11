import {
  BuiltInModelTypes,
  DjangoModel,
  DjangoProject,
  DjangoVersion,
  FieldTypes,
  RelationshipTypes,
} from "@djangobuilder/core";
import type { LocalModel, LocalProject } from "./types";

function toDjangoVersion(v: 3 | 4 | 5 | 6): DjangoVersion {
  if (v === 3) return DjangoVersion.DJANGO3;
  if (v === 4) return DjangoVersion.DJANGO4;
  if (v === 5) return DjangoVersion.DJANGO5;
  return DjangoVersion.DJANGO6;
}

/** Convert editable local state into a generation-ready core DjangoProject. */
export function buildCoreProject(project: LocalProject): DjangoProject {
  const core = new DjangoProject(
    project.name,
    project.description,
    toDjangoVersion(project.djangoVersion),
    { htmx: project.htmx, channels: project.channels },
    project.id,
  );

  // "app.Model" -> core model, used to resolve relationship targets by name.
  const modelIndex = new Map<string, DjangoModel>();
  // model id -> core model, used to resolve user-model parents by id.
  const coreModelById = new Map<string, DjangoModel>();
  // Local model paired with the core model it produced, so pass 2 wires
  // relationships onto the right owner by identity (not by re-looking-up name,
  // which would mis-wire if two models shared a name).
  const built: Array<{ localModel: LocalModel; coreModel: DjangoModel }> = [];

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
      coreModelById.set(model.id, coreModel);
      built.push({ localModel: model, coreModel });
    }
  }

  // Pass 2: parents (all user-model bases now exist). django parents resolve to
  // a built-in base by class name; user parents to the core model built above.
  for (const { localModel, coreModel } of built) {
    coreModel.parents = localModel.parents
      .map((p) => {
        if (p.type === "django") {
          const modelName = p.class.split(".").pop();
          return Object.values(BuiltInModelTypes).find((v) => v.model === modelName);
        }
        return coreModelById.get(p.model);
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v)) as DjangoModel["parents"];
  }

  // Pass 3: relationships (all targets now exist).
  for (const { localModel, coreModel } of built) {
    for (const rel of localModel.relationships) {
      const relType = RelationshipTypes[rel.type];
      if (!relType) throw new Error(`Unknown relationship type: ${rel.type}`);
      const target =
        BuiltInModelTypes[rel.to as keyof typeof BuiltInModelTypes] ?? modelIndex.get(rel.to);
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

  return core;
}
