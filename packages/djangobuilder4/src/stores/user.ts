import { defineStore } from "pinia";
import {
  fetchApps,
  fetchModels,
  fetchProjects,
  fetchFields,
  fetchRelationships,
  updateProject,
  updateApp,
  updateModel,
  updateField,
  updateRelationship,
  getDeleteBatch,
  deleteProject,
  deleteApp,
  deleteModel,
  deleteField,
  addApp,
  addModel,
  addField,
  addRelationship,
  deleteRelationship,
} from "../firebase";
import type { Unsubscribe, User } from "firebase/auth";
import type {
  App,
  DjangoParent,
  Field,
  Model,
  Project,
  Relationship,
  UserParent,
} from "@/types";
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
import type { IDjangoModel, IParentField } from "@djangobuilder/core/src/types";
import type { DjangoEntity } from "@djangobuilder/core/src/rendering";

function getRecordOrThrow(record: Record<string, DjangoEntity>, id: string) {
  const value = record[id];
  if (!value) {
    throw new Error(`${id} not found in ${record}`);
  }
  return value;
}

export const useUserStore = defineStore({
  id: "user",
  state: () => ({
    loaded: false,
    subscriptions: [] as Array<Unsubscribe>,
    firebaseUser: null as User | null,
    projects: {} as Record<string, Project>,
    apps: {} as Record<string, App>,
    models: {} as Record<string, Model>,
    fields: {} as Record<string, Field>,
    relationships: {} as Record<string, Relationship>,
    coreProjects: {} as Record<string, DjangoProject>,
    coreApps: {} as Record<string, DjangoApp>,
    coreModels: {} as Record<string, DjangoModel>,
  }),
  getters: {
    isLoaded: (state) => state.loaded,
    user: (state) => state.firebaseUser,
    getCoreProjects: (state) => state.coreProjects,
    getCoreProject: (state) => (projectid: string) =>
      getRecordOrThrow(state.coreProjects, projectid) as DjangoProject,
    getCoreApp: (state) => (appid: string) =>
      getRecordOrThrow(state.coreApps, appid) as DjangoApp,
  },
  actions: {
    getAllModelSubIds(model: DjangoModel) {
      return {
        fieldids: model.fields.map((field) => field.id),
        relationshipids: model.relationships.map(
          (relationship) => relationship.id
        ),
      };
    },
    getAllAppSubIds(app: DjangoApp) {
      const app_field_ids: Array<string> = [];
      const app_relationship_ids: Array<string> = [];
      const app_model_ids = app.models.map((model) => model.id);

      app.models.forEach((model: IDjangoModel) => {
        const { fieldids, relationshipids } = this.getAllModelSubIds(
          model as DjangoModel
        );
        app_field_ids.push(...fieldids);
        app_relationship_ids.push(...relationshipids);
      });

      return {
        modelids: app_model_ids,
        fieldids: app_field_ids,
        relationshipids: app_relationship_ids,
      };
    },
    getAllProjectSubIds(project: DjangoProject) {
      const project_model_ids: Array<string> = [];
      const project_field_ids: Array<string> = [];
      const project_relationship_ids: Array<string> = [];
      const project_app_ids: Array<string> = project.apps.map((app) => app.id);

      project.apps.forEach((app: DjangoApp) => {
        const { modelids, fieldids, relationshipids } =
          this.getAllAppSubIds(app);
        project_model_ids.push(...modelids);
        project_field_ids.push(...fieldids);
        project_relationship_ids.push(...relationshipids);
      });

      return {
        appids: project_app_ids,
        modelids: project_model_ids,
        fieldids: project_field_ids,
        relationshipids: project_relationship_ids,
      };
    },
    onUpdate(changedEntity: string, change: DocumentChange<DocumentData>) {
      const data = change.doc.data();
      const id = change.doc.id;
      if (change.type === "modified" || change.type === "added") {
        if (change.type === "modified") {
          console.log("Modified: ", changedEntity, data);
        } else if (change.type === "added") {
          //console.log("Added: ", changedEntity, data);
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
        if (changedEntity === "project") {
          delete this.projects[id];
          delete this.coreProjects[id];
        } else if (changedEntity === "app") {
          delete this.apps[id];
        } else if (changedEntity === "model") {
          delete this.models[id];
        } else if (changedEntity === "field") {
          delete this.fields[id];
        } else if (changedEntity === "relationship") {
          delete this.relationships[id];
        } else {
          console.error("Don't understand how to remove", changedEntity);
        }
      } else {
        console.error("Don't understand how to handle the change", change);
      }
      if (this.loaded) {
        this.createCoreProjects();
      }
    },
    setUser(user: User | null) {
      this.firebaseUser = user;
    },
    logoutUser() {
      this.subscriptions.forEach((unsub) => {
        unsub();
      });
      this.firebaseUser = null;
      this.projects = {};
      this.apps = {};
      this.models = {};
      this.fields = {};
      this.relationships = {};
      this.coreProjects = {};
      this.loaded = false;
    },
    async loginUser(user: User | null) {
      this.firebaseUser = user;
      if (user) {
        this.projects = {};
        this.apps = {};
        this.models = {};
        this.fields = {};
        this.relationships = {};
        this.coreProjects = {};
        await this.fetchUserData(user);
      }
    },
    createCoreProjects() {
      const parentUserModels: Map<string, UserParent[]> = new Map();
      const reletionshipsToInternalModels: Map<string, DjangoModel> = new Map();

      Object.entries(this.projects).forEach(([projectid, project]) => {
        const coreVersion = String(project.django_version).startsWith("3")
          ? DjangoVersion.DJANGO3
          : String(project.django_version).startsWith("4")
          ? DjangoVersion.DJANGO4
          : DjangoVersion.DJANGO5;

        const coreProject = new DjangoProject(
          project.name,
          project.description,
          coreVersion,
          { channels: project.channels, htmx: project.htmx },
          projectid
        );
        this.coreProjects[project.id] = coreProject;

        Object.keys(project.apps).forEach((appid) => {
          const app = this.apps[appid];
          if (!app) {
            console.error("Missing app", appid, "from project", project);
            return;
          }
          const coreApp = coreProject.addApp(app.name, [], appid);
          this.coreApps[appid] = coreApp;
          Object.keys(app.models).forEach((modelid) => {
            const model = this.models[modelid];
            if (!model) {
              console.error("Missing model", modelid, "from app", appid);
              return;
            }
            const coreParents: IParentField[] = [];

            if (model.parents) {
              model.parents
                .filter((p) => p.type === "django")
                .forEach((parent) => {
                  const parentModelName = (parent as DjangoParent).class
                    .split(".")
                    .pop();
                  const coreParent = Object.values(BuiltInModelTypes).find(
                    (v) => v.model === parentModelName
                  );
                  if (coreParent) {
                    coreParents.push(coreParent);
                  }
                });
            }
            const coreModel = coreApp.addModel(
              model.name,
              model.abstract,
              [],
              [],
              coreParents,
              modelid
            );

            if (model.parents) {
              parentUserModels.set(
                modelid,
                model.parents.filter((p) => p.type === "user") as UserParent[]
              );
            }

            this.coreModels[modelid] = coreModel as DjangoModel;
            Object.keys(model.fields).forEach((fieldid) => {
              const field = this.fields[fieldid];
              const typeSplit = field.type.split(".");
              const typeSplitLast = typeSplit[typeSplit.length - 1];
              const fieldType = FieldTypes[typeSplitLast];
              coreModel.addField(
                field.name,
                fieldType,
                field.args,
                false, // TODO - editable?
                fieldid
              );
            });

            Object.keys(model.relationships).forEach((relationshipid) => {
              const relationship = this.relationships[relationshipid];

              const toSplit = relationship.to.split(".");
              const toSplitLast = toSplit[toSplit.length - 1];
              const relationshipTo = Object.values(BuiltInModelTypes).find(
                (builtInModel) => builtInModel.model === toSplitLast
              );

              if (relationshipTo) {
                const typeSplit = relationship.type.split(".");
                const typeSplitLast = typeSplit[typeSplit.length - 1];
                const relationshipType = RelationshipTypes[typeSplitLast];
                coreModel.addRelationship(
                  relationship.name,
                  relationshipType,
                  relationshipTo,
                  relationship.args,
                  relationshipid
                );
              } else {
                reletionshipsToInternalModels.set(relationshipid, coreModel);
              }
            });
          });
        });
      });

      // We have initialized all models, now we can find relationships between them
      reletionshipsToInternalModels.forEach((coreModel, relationshipid) => {
        const relationship = this.relationships[relationshipid];
        const toSplit = relationship.to.split(".");
        const toSplitFirst = toSplit[0];
        const toSplitLast = toSplit[toSplit.length - 1];
        const foundModel = Object.values(this.coreModels).find(
          (coreModel) =>
            coreModel.name === toSplitLast &&
            coreModel.app.name === toSplitFirst
        );
        if (foundModel) {
          const typeSplit = relationship.type.split(".");
          const typeSplitLast = typeSplit[typeSplit.length - 1];
          const relationshipType = RelationshipTypes[typeSplitLast];
          coreModel.addRelationship(
            relationship.name,
            relationshipType,
            foundModel,
            relationship.args,
            relationshipid
          );
        }
      });

      parentUserModels.forEach((values, modelid) => {
        const childModel = this.coreModels[modelid];
        values.forEach((parent) => {
          const parentModel = this.coreModels[parent.model];
          if (parentModel) {
            childModel.parents.push(parentModel);
          } else {
            console.warn("Missing parent model", parent.model);
          }
        });
      });
    },
    async addApp(project: DjangoProject, name: string) {
      const user = this.user;
      if (user) {
        addApp(user, project.id, name);
      }
    },
    async addModel(app: DjangoApp, name: string, abstract: boolean) {
      const user = this.user;
      if (user) {
        addModel(user, app.id, name, abstract);
      }
    },
    async addField(
      model: DjangoModel,
      name: string,
      type: string,
      args: string
    ) {
      const user = this.user;
      if (user) {
        addField(user, model.id, name, type, args);
      }
    },
    async addRelationship(
      model: DjangoModel,
      name: string,
      type: string,
      to: string,
      args: string
    ) {
      const user = this.user;
      if (user) {
        addRelationship(user, model.id, name, type, to, args);
      }
    },
    async updateProject(
      project: DjangoProject,
      args: Record<string, string | boolean | number>
    ) {
      await updateProject(project.id, args);
    },
    async updateApp(
      app: DjangoApp,
      args: Record<string, string | boolean | number>
    ) {
      await updateApp(app.id, args);
    },
    async updateModel(
      model: DjangoModel,
      args: Record<string, string | boolean | number>
    ) {
      await updateModel(model.id, args);
    },
    async updateField(
      field: DjangoField,
      args: Record<string, string | boolean | number>
    ) {
      await updateField(field.id, args);
    },
    async updateRelationship(
      relationship: DjangoRelationship,
      args: Record<string, string | boolean | number>
    ) {
      await updateRelationship(relationship.id, args);
    },
    async deleteProject(project: DjangoProject) {
      const { appids, modelids, fieldids, relationshipids } =
        this.getAllProjectSubIds(project);
      const batch = await getDeleteBatch(
        [],
        appids,
        modelids,
        fieldids,
        relationshipids
      );
      await deleteProject(project.id, batch);
    },
    async deleteApp(app: DjangoApp) {
      const { modelids, fieldids, relationshipids } = this.getAllAppSubIds(app);
      const batch = await getDeleteBatch(
        [],
        [],
        modelids,
        fieldids,
        relationshipids
      );
      await deleteApp(app.project.id, app.id, batch);
    },
    async deleteModel(model: DjangoModel) {
      const { fieldids, relationshipids } = this.getAllModelSubIds(model);
      const batch = await getDeleteBatch(
        [],
        [],
        [model.id],
        fieldids,
        relationshipids
      );
      await deleteModel(model.app.id, model.id, batch);
    },
    async deleteField(field: DjangoField) {
      await deleteField(field.model.id, field.id);
    },
    async deleteRelationship(field: DjangoRelationship) {
      await deleteRelationship(field.model.id, field.id);
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
