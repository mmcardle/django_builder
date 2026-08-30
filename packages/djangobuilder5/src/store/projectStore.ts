import { create } from "zustand";
import type { User } from "firebase/auth";
import type { LocalParent, LocalProject, RelationshipTypeName } from "@/domain/types";
import { emptyFlatData, type FlatData, type ProjectSummary } from "@/domain/firestore/types";
import { renestProject, projectSummary } from "@/domain/firestore/mapper";
import { subscribeAll } from "@/domain/firestore/data";
import * as fs from "@/domain/firestore/writes";
import {
  inboundForAppDelete,
  inboundForModelDelete,
  retargetsForAppRename,
  retargetsForModelMove,
  retargetsForModelRename,
} from "@/domain/relationshipIntegrity";
import { toVersionNumber, type DjangoVersionNumber } from "@/domain/firestore/version";
import type { ParsedModel } from "@/domain/import";

interface ProjectState {
  user: User | null;
  data: FlatData;
  dataLoaded: boolean;
  /** Set when a Firestore listener fails; the data is stale from then on. */
  loadError: string | null;
  currentProjectId: string | null;
  selectedAppId: string | null;

  // derived, recomputed on every snapshot / open:
  project: LocalProject | null;
  summaries: ProjectSummary[];

  // lifecycle
  start: (user: User) => void;
  stop: () => void;
  openProject: (projectId: string) => void;
  dismissLoadError: () => void;

  // dashboard writes
  createProject: (name: string, description: string, v: DjangoVersionNumber, htmx: boolean, channels: boolean) => Promise<string | null>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteAllData: () => Promise<void>;

  // builder write-through
  setProjectName: (name: string) => void;
  setDescription: (description: string) => void;
  setDjangoVersion: (v: DjangoVersionNumber) => void;
  setFlag: (flag: "channels" | "htmx", value: boolean) => void;
  addApp: (name: string) => void;
  renameApp: (appId: string, name: string) => void;
  removeApp: (appId: string) => void;
  addModel: (appId: string, name: string) => void;
  importModels: (appId: string, models: ParsedModel[]) => void;
  updateModel: (appId: string, modelId: string, patch: Partial<{ name: string; abstract: boolean }>) => void;
  renameModel: (appId: string, modelId: string, name: string) => void;
  setModelParents: (appId: string, modelId: string, parents: LocalParent[]) => void;
  moveModel: (fromAppId: string, toAppId: string, modelId: string) => void;
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
  loadError: null,
  currentProjectId: null,
  selectedAppId: null,
  project: null,
  summaries: [],

  start: (user) => {
    unsubscribe?.();
    set({ user, data: emptyFlatData(), dataLoaded: false, loadError: null });
    unsubscribe = subscribeAll(
      user,
      (data, allLoaded) => {
        set((s) => ({ data, dataLoaded: allLoaded, ...recompute({ ...s, data }) }));
      },
      (err) => set({ loadError: err instanceof Error ? err.message : String(err) }),
    );
  },
  dismissLoadError: () => set({ loadError: null }),
  stop: () => {
    unsubscribe?.();
    unsubscribe = null;
    set({ user: null, data: emptyFlatData(), dataLoaded: false, loadError: null, currentProjectId: null, project: null, summaries: [] });
  },
  openProject: (projectId) =>
    set((s) => {
      const next = { ...s, currentProjectId: projectId };
      const project = renestProject(s.data, projectId);
      const app = project?.apps[0] ?? null;
      return { currentProjectId: projectId, ...recompute(next), selectedAppId: app?.id ?? null };
    }),

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
  /** Wipe everything this user owns (anonymous guest signing out). Failures are
   * logged, not thrown: the caller must still be able to complete the sign-out. */
  deleteAllData: async () => {
    const user = get().user;
    if (user) await Promise.resolve(fs.deleteAllUserData(user.uid)).catch(reportWriteError);
  },

  setProjectName: (name) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { name })); },
  setDescription: (description) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { description })); },
  setDjangoVersion: (v) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { django_version: toVersionNumber(v) })); },
  setFlag: (flag, value) => { const id = get().currentProjectId; if (id) guardWrite(fs.updateProject(id, { [flag]: value })); },

  addApp: (name) => { const { user, currentProjectId } = get(); if (user && currentProjectId) guardWrite(fs.addApp(user, currentProjectId, name)); },
  renameApp: (appId, name) => {
    const project = get().project;
    if (project) guardWrite(fs.renameApp(appId, name, retargetsForAppRename(project, appId, name)));
  },
  removeApp: (appId) => {
    const { project, currentProjectId } = get();
    const app = project?.apps.find((a) => a.id === appId);
    if (app && currentProjectId && project) {
      guardWrite(fs.removeApp(currentProjectId, app, inboundForAppDelete(project, appId)));
    }
  },
  addModel: (appId, name) => { const user = get().user; if (user) guardWrite(fs.addModel(user, appId, name)); },
  importModels: (appId, models) => { const user = get().user; if (user) guardWrite(fs.importModels(user, appId, models)); },
  updateModel: (_appId, modelId, patch) => guardWrite(fs.updateModel(modelId, patch)),
  renameModel: (appId, modelId, name) => {
    const project = get().project;
    if (project) guardWrite(fs.renameModel(modelId, name, retargetsForModelRename(project, appId, modelId, name)));
  },
  setModelParents: (_appId, modelId, parents) => guardWrite(fs.setModelParents(modelId, parents)),
  moveModel: (fromAppId, toAppId, modelId) => {
    const project = get().project;
    if (project) guardWrite(fs.moveModel(fromAppId, toAppId, modelId, retargetsForModelMove(project, fromAppId, toAppId, modelId)));
  },
  removeModel: (appId, modelId) => {
    const project = get().project;
    const model = findModel(project, appId, modelId);
    if (model && project) {
      guardWrite(fs.removeModel(appId, model, inboundForModelDelete(project, appId, modelId)));
    }
  },
  addField: (_appId, modelId) => { const user = get().user; if (user) guardWrite(fs.addField(user, modelId, "new_field", "CharField", "max_length=100")); },
  updateField: (_appId, _modelId, fieldId, patch) => guardWrite(fs.updateField(fieldId, patch)),
  removeField: (_appId, modelId, fieldId) => guardWrite(fs.removeField(modelId, fieldId)),
  addRelationship: (_appId, modelId) => { const user = get().user; if (user) guardWrite(fs.addRelationship(user, modelId, "related", "ForeignKey", "auth.User", "on_delete=models.CASCADE")); },
  updateRelationship: (_appId, _modelId, relId, patch) => guardWrite(fs.updateRelationship(relId, patch)),
  removeRelationship: (_appId, modelId, relId) => guardWrite(fs.removeRelationship(modelId, relId)),
}));
