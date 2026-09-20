import type { LocalApp, LocalModel, LocalProject, RelationshipTypeName } from "@/domain/types";
import { BuiltInModelTypes } from "@djangobuilder/core";
import { fromVersion } from "./version";
import type { FlatData, ProjectSummary } from "./types";

/** Projects created before the Dec-2024 core refactor stored fully-qualified
 * Django paths ("django.db.models.DateTimeField", "django.db.models.ForeignKey");
 * the core registries are keyed by bare class name. Strip the module path. */
export function bareTypeName(type: string): string {
  return type.split(".").pop() || type;
}

const builtInKeyByFullPath = new Map(
  Object.values(BuiltInModelTypes).map((b) => [b.fullPath, b.name] as const),
);

/** Legacy relationship targets were full paths ("django.contrib.auth.models.User");
 * map those to the registry key ("auth.User"). Anything else — modern built-in
 * keys or "<app>.<Model>" user targets — passes through untouched. */
export function normaliseTarget(to: string): string {
  return builtInKeyByFullPath.get(to) ?? to;
}

/** Re-nest the flat collections into one LocalProject (or null if absent). */
export function renestProject(data: FlatData, projectId: string): LocalProject | null {
  const project = data.projects[projectId];
  if (!project) return null;

  const apps: LocalApp[] = Object.keys(project.apps)
    .map((appId) => data.apps[appId])
    .filter(Boolean)
    .map((app) => {
      const models: LocalModel[] = Object.keys(app.models)
        .map((modelId) => data.models[modelId])
        .filter(Boolean)
        .map((model) => ({
          id: model.id,
          name: model.name,
          abstract: Boolean(model.abstract),
          // Keep django bases; drop user parents whose app/model no longer exist.
          parents: (model.parents ?? []).filter(
            (p) => p.type === "django" || (Boolean(data.apps[p.app]) && Boolean(data.models[p.model])),
          ),
          fields: Object.keys(model.fields)
            .map((fieldId) => data.fields[fieldId])
            .filter(Boolean)
            .map((f) => ({ id: f.id, name: f.name, type: bareTypeName(f.type), args: f.args ?? "" })),
          relationships: Object.keys(model.relationships)
            .map((relId) => data.relationships[relId])
            .filter(Boolean)
            .map((r) => ({
              id: r.id,
              name: r.name,
              type: bareTypeName(r.type) as RelationshipTypeName,
              to: normaliseTarget(r.to),
              args: r.args ?? "",
            })),
        }));
      return { id: app.id, name: app.name, models };
    });

  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    djangoVersion: fromVersion(project.django_version),
    channels: Boolean(project.channels),
    htmx: Boolean(project.htmx),
    apps,
  };
}

/** Lightweight summary for the dashboard (no field/relationship walk). */
export function projectSummary(data: FlatData, projectId: string): ProjectSummary | null {
  const project = data.projects[projectId];
  if (!project) return null;
  const appIds = Object.keys(project.apps).filter((id) => data.apps[id]);
  const modelCount = appIds.reduce(
    (n, id) => n + Object.keys(data.apps[id].models).filter((mid) => data.models[mid]).length,
    0,
  );
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    djangoVersion: fromVersion(project.django_version),
    channels: Boolean(project.channels),
    htmx: Boolean(project.htmx),
    appCount: appIds.length,
    modelCount,
  };
}
