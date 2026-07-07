import { create } from "zustand";
import type { User } from "firebase/auth";
import type { LocalProject, RelationshipTypeName } from "@/domain/types";
import { emptyFlatData, type FlatData, type ProjectSummary } from "@/domain/firestore/types";
import { renestProject, projectSummary } from "@/domain/firestore/mapper";
import { subscribeAll } from "@/domain/firestore/data";
import * as fs from "@/domain/firestore/writes";
import { toVersionNumber, type DjangoVersionNumber } from "@/domain/firestore/version";

interface ProjectState {
  user: User | null;
  data: FlatData;
  dataLoaded: boolean;
  currentProjectId: string | null;
  selectedAppId: string | null;
  selectedModelId: string | null;

  // derived, recomputed on every snapshot / open:
  project: LocalProject | null;
  summaries: ProjectSummary[];

  // lifecycle
  start: (user: User) => void;
  stop: () => void;
  openProject: (projectId: string) => void;
  select: (appId: string, modelId: string | null) => void;

  // dashboard writes
  createProject: (name: string, description: string, v: DjangoVersionNumber, htmx: boolean, channels: boolean) => Promise<string | null>;
  deleteProject: (projectId: string) => Promise<void>;

  // builder write-through
  setProjectName: (name: string) => void;
  setDescription: (description: string) => void;
  setDjangoVersion: (v: DjangoVersionNumber) => void;
  setFlag: (flag: "channels" | "htmx", value: boolean) => void;
  addApp: (name: string) => void;
  addModel: (appId: string, name: string) => void;
  removeModel: (appId: string, modelId: string) => void;
  addField: (appId: string, modelId: string) => void;
  updateField: (appId: string, modelId: string, fieldId: string, patch: Partial<{ name: string; type: string; args: string }>) => void;
  removeField: (appId: string, modelId: string, fieldId: string) => void;
  addRelationship: (appId: string, modelId: string) => void;
  updateRelationship: (appId: string, modelId: string, relId: string, patch: Partial<{ name: string; type: RelationshipTypeName; to: string; args: string }>) => void;
  removeRelationship: (appId: string, modelId: string, relId: string) => void;
}

let unsubscribe: (() => void) | null = null;

function recompute(state: ProjectState): Partial<ProjectState> {
  return {
    project: state.currentProjectId ? renestProject(state.data, state.currentProjectId) : null,
    summaries: Object.keys(state.data.projects)
      .map((id) => projectSummary(state.data, id))
      .filter((s): s is ProjectSummary => s !== null)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function findModel(project: LocalProject | null, appId: string, modelId: string) {
  return project?.apps.find((a) => a.id === appId)?.models.find((m) => m.id === modelId) ?? null;
}

function reportWriteError(err: unknown): void {
  console.error("[db5] Firestore write failed", err);
}

/** Fire a write-through op and surface (log) failures instead of leaving an
 * unhandled rejection. Tolerates a mocked op that returns a non-promise. */
function guardWrite(op: unknown): void {
  Promise.resolve(op).catch(reportWriteError);
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  user: null,
  data: emptyFlatData(),
  dataLoaded: false,
  currentProjectId: null,
  selectedAppId: null,
  selectedModelId: null,
  project: null,
  summaries: [],

  start: (user) => {
    unsubscribe?.();
    set({ user, data: emptyFlatData(), dataLoaded: false });
    unsubscribe = subscribeAll(user, (data, allLoaded) => {
      set((s) => ({ data, dataLoaded: allLoaded, ...recompute({ ...s, data }) }));
    });
  },
  stop: () => {
    unsubscribe?.();
    unsubscribe = null;
    set({ user: null, data: emptyFlatData(), dataLoaded: false, currentProjectId: null, project: null, summaries: [] });
  },
  openProject: (projectId) =>
    set((s) => {
      const next = { ...s, currentProjectId: projectId };
      const project = renestProject(s.data, projectId);
      const app = project?.apps[0] ?? null;
      return { currentProjectId: projectId, ...recompute(next), selectedAppId: app?.id ?? null, selectedModelId: app?.models[0]?.id ?? null };
    }),
  select: (appId, modelId) => set({ selectedAppId: appId, selectedModelId: modelId }),

  createProject: async (name, description, v, htmx, channels) => {
    const user = get().user;
    if (!user) return null;
    try {
      return await fs.createProject(user, name, description, v, htmx, channels);
    } catch (err) {
      reportWriteError(err);
      return null;
    }
  },
  deleteProject: async (projectId) => {
    const project = renestProject(get().data, projectId);
    if (project) await Promise.resolve(fs.deleteProjectCascade(project)).catch(reportWriteError);
  },

  setProjectName: (name) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { name })); },
  setDescription: (description) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { description })); },
  setDjangoVersion: (v) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { django_version: toVersionNumber(v) })); },
  setFlag: (flag, value) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { [flag]: value })); },

  addApp: (name) => { const { user, currentProjectId } = get(); if (user && currentProjectId) guardWrite(fs.addApp(user, currentProjectId, name)); },
  addModel: (appId, name) => { const user = get().user; if (user) guardWrite(fs.addModel(user, appId, name)); },
  removeModel: (appId, modelId) => {
    const model = findModel(get().project, appId, modelId);
    if (model) guardWrite(fs.removeModel(appId, model));
  },
  addField: (_appId, modelId) => { const user = get().user; if (user) guardWrite(fs.addField(user, modelId, "new_field", "CharField", "max_length=100")); },
  updateField: (_appId, _modelId, fieldId, patch) => guardWrite(fs.updateField(fieldId, patch)),
  removeField: (_appId, modelId, fieldId) => guardWrite(fs.removeField(modelId, fieldId)),
  addRelationship: (_appId, modelId) => { const user = get().user; if (user) guardWrite(fs.addRelationship(user, modelId, "related", "ForeignKey", "auth.User", "on_delete=models.CASCADE")); },
  updateRelationship: (_appId, _modelId, relId, patch) => guardWrite(fs.updateRelationship(relId, patch)),
  removeRelationship: (_appId, modelId, relId) => guardWrite(fs.removeRelationship(modelId, relId)),
}));
