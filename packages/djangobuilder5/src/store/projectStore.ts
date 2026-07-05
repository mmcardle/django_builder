import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { LocalField, LocalProject, RelationshipTypeName } from "@/domain/types";
import { makeSeedProject } from "@/domain/seed";

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

interface ProjectState {
  project: LocalProject;
  selectedAppId: string | null;
  selectedModelId: string | null;

  select: (appId: string, modelId: string | null) => void;
  setProjectName: (name: string) => void;
  setDjangoVersion: (v: 3 | 4 | 5) => void;
  setFlag: (flag: "channels" | "htmx" | "postgres", value: boolean) => void;

  addApp: (name: string) => void;
  addModel: (appId: string, name: string) => void;
  removeModel: (appId: string, modelId: string) => void;

  addField: (appId: string, modelId: string) => void;
  updateField: (appId: string, modelId: string, fieldId: string, patch: Partial<LocalField>) => void;
  removeField: (appId: string, modelId: string, fieldId: string) => void;

  addRelationship: (appId: string, modelId: string) => void;
  updateRelationship: (
    appId: string,
    modelId: string,
    relId: string,
    patch: Partial<{ name: string; type: RelationshipTypeName; to: string; args: string }>,
  ) => void;
  removeRelationship: (appId: string, modelId: string, relId: string) => void;
}

function findModel(project: LocalProject, appId: string, modelId: string) {
  return project.apps.find((a) => a.id === appId)?.models.find((m) => m.id === modelId);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set) => ({
      project: makeSeedProject(),
      selectedAppId: "app_blog",
      selectedModelId: "model_post",

      select: (appId, modelId) =>
        set((s) => {
          s.selectedAppId = appId;
          s.selectedModelId = modelId;
        }),
      setProjectName: (name) => set((s) => void (s.project.name = name)),
      setDjangoVersion: (v) => set((s) => void (s.project.djangoVersion = v)),
      setFlag: (flag, value) => set((s) => void (s.project[flag] = value)),

      addApp: (name) =>
        set((s) => {
          s.project.apps.push({ id: uid("app"), name, models: [] });
        }),

      addModel: (appId, name) =>
        set((s) => {
          const app = s.project.apps.find((a) => a.id === appId);
          if (!app) return;
          const id = uid("model");
          app.models.push({ id, name, abstract: false, fields: [], relationships: [] });
          s.selectedAppId = appId;
          s.selectedModelId = id;
        }),

      removeModel: (appId, modelId) =>
        set((s) => {
          const app = s.project.apps.find((a) => a.id === appId);
          if (!app) return;
          app.models = app.models.filter((m) => m.id !== modelId);
          if (s.selectedModelId === modelId) s.selectedModelId = app.models[0]?.id ?? null;
        }),

      addField: (appId, modelId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          model?.fields.push({ id: uid("f"), name: "new_field", type: "CharField", args: "max_length=100" });
        }),

      updateField: (appId, modelId, fieldId, patch) =>
        set((s) => {
          const field = findModel(s.project, appId, modelId)?.fields.find((f) => f.id === fieldId);
          if (field) Object.assign(field, patch);
        }),

      removeField: (appId, modelId, fieldId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          if (model) model.fields = model.fields.filter((f) => f.id !== fieldId);
        }),

      addRelationship: (appId, modelId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          model?.relationships.push({
            id: uid("r"),
            name: "related",
            type: "ForeignKey",
            to: "auth.User",
            args: "on_delete=models.CASCADE",
          });
        }),

      updateRelationship: (appId, modelId, relId, patch) =>
        set((s) => {
          const rel = findModel(s.project, appId, modelId)?.relationships.find((r) => r.id === relId);
          if (rel) Object.assign(rel, patch);
        }),

      removeRelationship: (appId, modelId, relId) =>
        set((s) => {
          const model = findModel(s.project, appId, modelId);
          if (model) model.relationships = model.relationships.filter((r) => r.id !== relId);
        }),
    })),
    { name: "db5-project" },
  ),
);
