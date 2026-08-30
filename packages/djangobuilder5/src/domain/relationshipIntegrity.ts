import type { LocalProject } from "./types";

export interface Retarget {
  id: string;
  to: string;
}

/** A relationship addressed together with the model that owns it, so the write
 * can clear the owner's `relationships` map key as well as delete the doc. */
export interface RelationshipRef {
  modelId: string;
  relId: string;
}

/** Every relationship in the project pointing at one of `moves`' keys, paired
 * with the new target it should be repointed to. */
function collect(project: LocalProject, moves: Map<string, string>): Retarget[] {
  const out: Retarget[] = [];
  for (const app of project.apps) {
    for (const model of app.models) {
      for (const rel of model.relationships) {
        const to = moves.get(rel.to);
        if (to) out.push({ id: rel.id, to });
      }
    }
  }
  return out;
}

/**
 * A relationship's target is stored denormalised as an `"app.Model"` string, so
 * anything that changes a model's qualified name — renaming its app, renaming
 * the model, moving it to another app — strands every relationship pointing at
 * it. `buildCoreProject` throws on an unresolvable target, and the builder
 * renders its file tree unguarded, so a stale `to` takes the whole page down.
 * These helpers return the repointing writes that must accompany the rename.
 */
export function retargetsForAppRename(
  project: LocalProject,
  appId: string,
  newName: string,
): Retarget[] {
  const app = project.apps.find((a) => a.id === appId);
  if (!app || app.name === newName) return [];
  return collect(
    project,
    new Map(app.models.map((m) => [`${app.name}.${m.name}`, `${newName}.${m.name}`])),
  );
}

export function retargetsForModelRename(
  project: LocalProject,
  appId: string,
  modelId: string,
  newName: string,
): Retarget[] {
  const app = project.apps.find((a) => a.id === appId);
  const model = app?.models.find((m) => m.id === modelId);
  if (!app || !model || model.name === newName) return [];
  return collect(project, new Map([[`${app.name}.${model.name}`, `${app.name}.${newName}`]]));
}

export function retargetsForModelMove(
  project: LocalProject,
  fromAppId: string,
  toAppId: string,
  modelId: string,
): Retarget[] {
  const from = project.apps.find((a) => a.id === fromAppId);
  const to = project.apps.find((a) => a.id === toAppId);
  const model = from?.models.find((m) => m.id === modelId);
  if (!from || !to || !model || from.id === to.id) return [];
  return collect(project, new Map([[`${from.name}.${model.name}`, `${to.name}.${model.name}`]]));
}

/** Relationships pointing at any of `targets`, skipping those owned by a model
 * in `ignoreModelIds` (a model's own relationships are already being deleted by
 * the cascade that triggered the lookup). */
function inbound(
  project: LocalProject,
  targets: Set<string>,
  ignoreModelIds: Set<string>,
): RelationshipRef[] {
  const out: RelationshipRef[] = [];
  for (const app of project.apps) {
    for (const model of app.models) {
      if (ignoreModelIds.has(model.id)) continue;
      for (const rel of model.relationships) {
        if (targets.has(rel.to)) out.push({ modelId: model.id, relId: rel.id });
      }
    }
  }
  return out;
}

/**
 * Relationships elsewhere in the project that point at a model about to be
 * deleted. Nothing sensible can be repointed to, so these are deleted with it —
 * otherwise their `to` dangles, and a dangling target is silently dropped from
 * the generated code (see `buildCoreProject`) while the stale doc lingers.
 */
export function inboundForModelDelete(
  project: LocalProject,
  appId: string,
  modelId: string,
): RelationshipRef[] {
  const app = project.apps.find((a) => a.id === appId);
  const model = app?.models.find((m) => m.id === modelId);
  if (!app || !model) return [];
  return inbound(project, new Set([`${app.name}.${model.name}`]), new Set([modelId]));
}

/** As above, for every model of an app about to be deleted. */
export function inboundForAppDelete(project: LocalProject, appId: string): RelationshipRef[] {
  const app = project.apps.find((a) => a.id === appId);
  if (!app) return [];
  return inbound(
    project,
    new Set(app.models.map((m) => `${app.name}.${m.name}`)),
    new Set(app.models.map((m) => m.id)),
  );
}
