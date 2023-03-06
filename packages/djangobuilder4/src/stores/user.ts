import { defineStore } from "pinia";
import {
  fetchApps,
  fetchModels,
  fetchProjects,
  fetchFields,
  fetchRelationships,
} from "../firebase";
import type { Unsubscribe, User } from "firebase/auth";
import type { App, Field, Model, Project, Relationship } from "@/types";
import type { DocumentChange, DocumentData } from "firebase/firestore";
import {
  BuiltInModelTypes,
  DjangoApp,
  DjangoProject,
  DjangoRelationship,
  DjangoVersion,
  FieldTypes,
  RelationshipTypes,
  DjangoField,
  DjangoModel,
} from "@djangobuilder/core";
import { AuthUser } from "@djangobuilder/core/src/api";

export const useUserStore = defineStore({
  id: "user",
  state: () => ({
    loaded: false,
    subscriptions: [] as Array<Unsubscribe>,
    user: null as User | null,
    projects: {} as Record<string, Project>,
    apps: {} as Record<string, App>,
    models: {} as Record<string, Model>,
    fields: {} as Record<string, Field>,
    relationships: {} as Record<string, Relationship>,
    coreProjects: {} as Record<string, DjangoProject>,
    projectids: {} as Map<DjangoProject, string>,
    appids: {} as Map<DjangoApp, string>,
    modelids: {} as Map<DjangoModel, string>,
    fieldids: {} as Map<DjangoField, string>,
    relationshipids: {} as Map<DjangoRelationship, string>,
  }),
  getters: {
    getLoaded: (state) => state.loaded,
    getUser: (state) => state.user,
    getProjects: (state) => state.projects,
    getProject: (state) => (projectid: string) => state.projects[projectid],
    getApps: (state) => state.apps,
    getModels: (state) => state.models,
    getFields: (state) => state.fields,
    getRelationships: (state) => state.relationships,
    getCoreProjects: (state) => state.coreProjects,
    getCoreProject: (state) => (projectid: string) =>
      state.coreProjects[projectid],
    getProjectId: (state) => (project: DjangoProject) =>
      state.projectids.get(project),
    getAppId: (state) => (app: DjangoApp) => state.appids.get(app),
    getModelId: (state) => (app: DjangoModel) => state.modelids.get(app),
    getFieldId: (state) => (field: DjangoField) => state.fieldids.get(field),
    getRelationshipId: (state) => (relationship: DjangoRelationship) =>
      state.relationshipids.get(relationship),
  },
  actions: {
    onUpdate(changedEntity: string, change: DocumentChange<DocumentData>) {
      const data = change.doc.data();
      const id = change.doc.id;
      if (change.type === "modified" || change.type === "added") {
        if (change.type === "modified") {
          console.log("Modified: ", changedEntity, data);
        } else if (change.type === "added") {
          console.log("Added: ", changedEntity, data);
        } else {
          console.error("Don't understand how to handle change", change.type);
        }
        if (changedEntity === "project") {
          this.projects[id] = Object.assign(data, { id }) as Project;
        } else if (changedEntity === "app") {
          this.apps[id] = Object.assign(data, { id }) as App;
        } else if (changedEntity === "model") {
          this.models[id] = Object.assign(data, { id }) as Model;
        } else if (changedEntity === "field") {
          this.fields[id] = Object.assign(data, { id }) as Field;
        } else if (changedEntity === "relationship") {
          this.relationships[id] = Object.assign(data, { id }) as Relationship;
        } else {
          console.error("Don't understand how to update/add", changedEntity);
        }
      } else if (change.type === "removed") {
        console.log("Removed: ", changedEntity, data);
      } else {
        console.error("Don't understand how to handle the change", change);
      }
      this.createCoreProjects();
    },
    setUser(user: User | null) {
      this.user = user;
    },
    logoutUser() {
      this.subscriptions.forEach((unsub) => {
        unsub();
      });
      this.user = null;
      this.projects = {};
      this.apps = {};
      this.models = {};
      this.fields = {};
      this.relationships = {};
      this.coreProjects = {};
      this.projectids = new Map();
      this.appids = new Map();
      this.modelids = new Map();
      this.fieldids = new Map();
      this.relationshipids = new Map();
      this.loaded = false;
    },
    loginUser(user: User | null) {
      this.user = user;
      if (user) {
        this.projects = {};
        this.apps = {};
        this.models = {};
        this.fields = {};
        this.relationships = {};
        this.coreProjects = {};
        this.projectids = new Map();
        this.appids = new Map();
        this.modelids = new Map();
        this.fieldids = new Map();
        this.relationshipids = new Map();
        this.fetchUserData(user);
      }
    },
    createCoreProjects() {
      Object.entries(this.projects).forEach(([projectid, project]) => {
        const coreVersion = String(project.django_version).startsWith("2")
          ? DjangoVersion.DJANGO2
          : String(project.django_version).startsWith("3")
          ? DjangoVersion.DJANGO3
          : DjangoVersion.DJANGO4;

        const coreProject = new DjangoProject(
          project.name,
          project.description,
          coreVersion,
          { channels: project.channels, htmx: project.htmx }
        );
        this.projectids.set(coreProject, projectid);
        this.coreProjects[projectid] = coreProject;

        Object.keys(project.apps).forEach((appid) => {
          const app = this.apps[appid];
          if (!app) {
            console.error("Missing app", appid, "from project", project);
            return;
          }
          const coreApp = coreProject.addApp(app.name);
          this.appids.set(coreApp, appid);
          Object.keys(app.models).forEach((modelid) => {
            const model = this.models[modelid];
            const coreModel = coreApp.addModel(model.name, model.abstract);
            this.modelids.set(coreModel as DjangoModel, modelid);
            Object.keys(model.fields).forEach((fieldid) => {
              const field = this.fields[fieldid];
              const typeSplit = field.type.split(".");
              const typeSplitLast = typeSplit[typeSplit.length - 1];
              const fieldType = FieldTypes[typeSplitLast];
              // TODO - editable?
              const coreField = coreModel.addField(
                field.name,
                fieldType,
                field.args,
                false
              );
              this.fieldids.set(coreField as DjangoField, fieldid);
            });

            Object.keys(model.relationships).forEach((relationshipid) => {
              const relationship = this.relationships[relationshipid];

              const typeSplit = relationship.type.split(".");
              const typeSplitLast = typeSplit[typeSplit.length - 1];
              const relationshipType = RelationshipTypes[typeSplitLast];

              // TODO - relationship.to might be to another model
              const toSplit = relationship.to.split(".");
              const toSplitLast = toSplit[toSplit.length - 1];
              const relationshipTo = Object.values(BuiltInModelTypes).find(
                (bim) => bim.model === toSplitLast
              );

              const coreRelationship = coreModel.addRelationship(
                relationship.name,
                relationshipType,
                relationshipTo || AuthUser,
                relationship.args
              );
              this.relationshipids.set(coreRelationship, relationshipid);
            });
          });
        });
      });
    },
    async fetchUserData(user: User) {
      this.loaded = false;
      const [
        projectsData,
        appsData,
        modelsData,
        fieldsData,
        relationshipsData,
      ] = await Promise.all([
        fetchProjects(user, (change) => this.onUpdate("project", change)),
        fetchApps(user, (change) => this.onUpdate("app", change)),
        fetchModels(user, (change) => this.onUpdate("model", change)),
        fetchFields(user, (change) => this.onUpdate("field", change)),
        fetchRelationships(user, (change) =>
          this.onUpdate("relationship", change)
        ),
      ]);
      const { result: projects, unsubscribe: onsubProjects } = projectsData;
      const { result: apps, unsubscribe: onsubApps } = appsData;
      const { result: models, unsubscribe: onsubModels } = modelsData;
      const { result: fields, unsubscribe: onsubFields } = fieldsData;
      const { result: relationships, unsubscribe: onsubRelationships } =
        relationshipsData;
      console.debug("projects", projects);
      console.debug("apps", apps);
      console.debug("models", models);
      console.debug("fields", fields);
      console.debug("relationships", relationships);
      this.projects = projects;
      this.apps = apps;
      this.models = models;
      this.fields = fields;
      this.relationships = relationships;
      this.createCoreProjects();
      this.subscriptions = [
        onsubProjects,
        onsubApps,
        onsubModels,
        onsubFields,
        onsubRelationships,
      ];
      this.loaded = true;
    },
  },
});
