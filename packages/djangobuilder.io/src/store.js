import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {keyByValue} from './utils'
import { event } from 'vue-gtag'
import {
  DjangoProject, DjangoApp, DjangoModel, DjangoField, DjangoRelationship, DjangoVersion, FieldTypes, BuiltInModelTypes
} from "@djangobuilder/core";

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: undefined,
    loaded: false,
    error: false,
    projects: {},
    apps: {},
    models: {},
    fields: {},
    relationships: {},
  },
  getters: {
    user: (state) => () => state.user,
    loaded: (state) => () => state.loaded,
    error: (state) => () => state.error,
    projects: (state) => () => state.projects,
    projectsData: (state) => () => {
      return Object.keys(state.projects).map((pid) => {
        return Object.assign(state.projects[pid].data(), {id: pid})
      })
    },
    projectData: (state) => (id) => state.projects[id],
    toCoreProject: (state) => (projectId, project) => {
      const coreVersion = String(project.django_version).startsWith("3")
        ? DjangoVersion.DJANGO3
        : String(project.django_version).startsWith("4")
        ? DjangoVersion.DJANGO4
        : DjangoVersion.DJANGO5;

      const coreProject = new DjangoProject(
        project.name,
        project.description,
        coreVersion,
        {htmx: project.htmx, channels: project.channels},
        projectId
      );

      Object.keys(project.apps).forEach(appId => {
        const appData = state.apps[appId].data();
        const coreApp = new DjangoApp(coreProject, appData.name, [], appId);
        coreProject.apps.push(coreApp)

        Object.keys(appData.models).forEach(modelId => {
          const modelData = state.models[modelId].data();

          let parents = [];
          modelData.parents?.filter((p) => p.type === "django")
            .forEach((parent) => {
              const parentModelName = parent.class
                .split(".")
                .pop();
              const coreParent = Object.values(BuiltInModelTypes).find(
                (v) => v.model === parentModelName
              );
              if (coreParent) {
                parents.push(coreParent);
              }
            });

          const coreModel = coreApp.addModel(
            modelData.name,
            modelData.abstract,
            [],
            [],
            parents,
            modelId
          );

          Object.keys(modelData.fields).forEach(fieldId => {
            const fieldData = state.fields[fieldId].data();
            let fieldType = FieldTypes[fieldData.type]
            if (!fieldType) {
              const xs = fieldData.type.split(".")
              const x = xs[xs.length -1]
              fieldType = FieldTypes[x]
            }
            const coreField = new DjangoField(
              coreModel, fieldData.name, fieldType, fieldData.args, fieldId
            );
            coreModel.fields.push(coreField);
          });

          Object.keys(modelData.relationships).forEach(relationshipId => {
            const relationshipData = state.relationships[relationshipId].data();
            const coreRelationship = new DjangoRelationship(
              coreModel, 
              relationshipData.name,
              relationshipData.type,
              relationshipData.to,
              relationshipData.args,
              relationshipId
            )
            coreModel.relationships.push(coreRelationship);
          });
        })
      });
      return coreProject
    },
    apps: (state) => () => state.apps,
    appData: (state) => (id) => state.apps[id] ? state.apps[id].data() : undefined,
    models: (state) => () => state.models,
    modelData: (state) => (id) => state.models[id] ? state.models[id].data() : undefined,
    fields: (state) => () => state.fields,
    relationships: (state) => () => state.relationships,
    ordered_models: (state) => (appid) => {
      const appData = state.apps[appid] ? state.apps[appid].data() : undefined;
      if (appData === undefined) { return [] }
      const unordered_models = Object.keys(appData.models).map((model) => {
        if (state.models[model]) {
          return Object.assign(state.models[model].data(), {id: model})
        }
      })
      const models_no_parents = unordered_models.filter(model => model !== undefined).filter((model) => {
        return model.parents.length === 0
      })

      const models_with_parents = unordered_models.filter(model => model !== undefined).filter((model) => {
        return model.parents.length !== 0
      })

      const models_with_parents_sorted = models_with_parents.sort((model, otherModel) => {
        return otherModel.parents.indexOf(model.name) === -1 ? 1 : -1
      });

      return models_no_parents.concat(models_with_parents_sorted)
    },
  },
  mutations: {
    set_state (state, payload) {
      Vue.set(state, payload.key, payload.values)
    },
    set_error (state, error) {
      state.error = error
    },
    set_user (state, user) {
      console.log('Loaded', !user.isAnonymous ? user.display_name : 'Anonymous User ' + user.uid)
      state.loaded = true
      state.user = user

      if (user.isAnonymous){
        event('user-login', {
          event_category: 'auth',
          event_label: 'AnonymousLogin',
          value: 1
        })
      } else {
        event('user-login', {
          event_category: 'auth',
          event_label: 'UserLogin',
          value: 1
        })
      }
    },
    logout (state) {
      event('user-logout', {
        event_category: 'auth',
        event_label: 'UserLogout',
        value: 1
      })
      state.user = undefined
      state.loaded = false
      state.projects = {}
      state.apps = {}
      state.models = {}
      state.fields = {}
      state.relationships = {}
    },
  },
  actions: {
    load : function ({commit}, userid) {
      var firestore = firebase.firestore()

      const snapShotErrorHandler = function (error) {
        if (firebase.auth().currentUser) {
          commit('set_error', error)
          throw error
        } else {
          // This is OK user as no longer logged in
        }
      }

      const projectPromise = new Promise((resolve) => {
        firestore.collection('projects').where(
          "owner", "==", userid
        ).orderBy("name").onSnapshot((projectData) => {
          const projects = keyByValue(projectData.docs, "id")
          commit('set_state', {key: 'projects', values: projects})
          console.debug('Loaded projects', JSON.parse(JSON.stringify(projectData.docs.map((p) => p.data()))))
          resolve(projectData)
        }, snapShotErrorHandler)
      })
      const appPromise = new Promise((resolve) => {
        firestore.collection('apps').where(
          "owner", "==", userid
        ).onSnapshot((appData) => {
          const apps = keyByValue(appData.docs, "id")
          commit('set_state', {key: 'apps', values: apps})
          console.debug('Loaded apps', JSON.parse(JSON.stringify(appData.docs.map((a) => a.data()))))
          resolve()
        }, snapShotErrorHandler)
      })

      const modelsPromise = new Promise((resolve) => {
        firestore.collection('models').where(
          "owner", "==", userid
        ).onSnapshot((modelData) => {
          const models = keyByValue(modelData.docs, "id")
          commit('set_state', {key: 'models', values: models})
          console.debug('Loaded models', JSON.parse(JSON.stringify(modelData.docs.map((m) => m.data()))))
          resolve()
        }, snapShotErrorHandler)
      })

      const fieldsPromise = new Promise((resolve) => {
        firestore.collection('fields').where(
          "owner", "==", userid
        ).onSnapshot((fieldsData) => {
          const fields = keyByValue(fieldsData.docs, "id")
          commit('set_state', {key: 'fields', values: fields})
          console.debug('Loaded fields', JSON.parse(JSON.stringify(fieldsData.docs.map((f) => f.data()))))
          resolve()
        }, snapShotErrorHandler)
      })

      const relationshipPromise = new Promise((resolve) => {
        firestore.collection('relationships').where(
          "owner", "==", userid
        ).onSnapshot((relationshipData) => {
          const relationships = keyByValue(relationshipData.docs, "id")
          commit('set_state', {key: 'relationships', values: relationships})
          console.debug('Loaded relationships', JSON.parse(JSON.stringify(relationshipData.docs.map((r) => r.data()))))
          resolve()
        }, snapShotErrorHandler)
      })

      const promises = [projectPromise, appPromise, modelsPromise, fieldsPromise, relationshipPromise]
      return Promise.all(promises).then(async () => {
        commit('set_user', firebase.auth().currentUser)
      })
    },
    addProject: function (_, payload) {
      event('add-project', {
        event_category: 'project',
        event_label: payload.name,
        value: 1
      })
      return firebase.firestore().collection('projects').add({
        owner: firebase.auth().currentUser.uid,
        name: payload.name,
        description: payload.description,
        channels: payload.channels,
        htmx: payload.htmx,
        django_version: payload.django_version,
        apps: {}
      })
    },
    addApp: function (_, payload) {
      event('add-app', {
        event_category: 'app',
        event_label: payload.name,
        value: 1
      })
      return firebase.firestore().collection('apps').add({
        owner: firebase.auth().currentUser.uid,
        name: payload.name,
        models: {}
      }).then((app) => {
        firebase.firestore().collection('projects').doc(payload.project).update(
          {[`apps.${app.id}`]: true}
        )
      })
    },
    addModels: function (_, payload) {
      event('add-models', {
        event_category: 'model',
        event_label: 'multiple-models',
        eventValue: payload.length
      })
      const userid = firebase.auth().currentUser.uid

      const db = firebase.firestore()
      // Get a new write batch
      var batch = db.batch();
      payload.forEach(model => {

        const fields = {};
        const relationships = {}

        model.fields.forEach(field => {
          const newFieldRef= db.collection('fields').doc();
          batch.set(newFieldRef, {
            owner: userid,
            name: field.name,
            type: field.type,
            args: field.args || ''
          })
          fields[newFieldRef.id] = true;
        })

        const modelData = {
          owner: userid,
          name: model.name,
          parents: model.parents || [],
          abstract: Boolean(model.abstract),
          fields,
          relationships,
        }
        var newModelRef = db.collection('models').doc();

        // Add it in the batch
        batch.set(newModelRef, modelData);

        var appRef = db.collection("apps").doc(model.app);
        const appData = {[`models.${newModelRef.id}`]: true}
        batch.update(appRef, appData);

      })
      // Commit the batch
      return batch.commit().then(function () {
        console.debug('Added batch of ', payload.length, 'models')
      });
    },
    addModel: function ({dispatch}, payload) {
      event('add-model', {
        event_category: 'model',
        event_label: payload.name,
        value: 1
      })
      console.log('Addmodel', payload, firebase.auth().currentUser.uid)
      return firebase.firestore().collection('models').add({
        owner: firebase.auth().currentUser.uid,
        name: payload.name,
        parents: payload.parents || [],
        abstract: Boolean(payload.abstract),
        fields: {},
        relationships: {}
      }).then((model) => {
        if (payload.add_default_fields) {
          return dispatch('addDefaultFields', model).then(() => {
            return firebase.firestore().collection('apps').doc(payload.app).update(
              {[`models.${model.id}`]: true}
            ).then(() => model)
          })
        } else {
          return firebase.firestore().collection('apps').doc(payload.app).update(
            {[`models.${model.id}`]: true}
          ).then(() => model)
        }
      })
    },
    addDefaultFields: function ({dispatch}, model) {
      const created_field_payload = {
        model: model.id,
        name: 'created',
        type: 'DateTimeField',
        args: 'auto_now_add=True, editable=False'
      }
      return dispatch('addField', created_field_payload).then(() => {

        const last_updated_field_payload = {
          model: model.id,
          name: 'last_updated',
          type: 'DateTimeField',
          args: 'auto_now=True, editable=False'
        }

        return dispatch('addField', last_updated_field_payload)
      })
    },
    addField: function (_, payload) {
      event('add-field', {
        event_category: 'field',
        event_label: payload.name,
        value: 1
      })
      return firebase.firestore().collection('fields').add({
        owner: firebase.auth().currentUser.uid,
        name: payload.name,
        type: payload.type,
        args: payload.args || ''
      }).then((field) => {
        firebase.firestore().collection('models').doc(payload.model).update(
          {[`fields.${field.id}`]: true}
        )
      })
    },
    addFieldsAndRelationships: function (_ , payload) {
      console.log('addFieldsAndRelationships', payload)

      const db = firebase.firestore()

      const newFields = []
      const newRelationships = []

      // Get a new write batch
      var batch = db.batch();

      payload.fields.forEach((fieldData) => {
        const newFieldRef = db.collection('fields').doc();
        batch.set(newFieldRef, {
          owner: firebase.auth().currentUser.uid,
          name: fieldData.name,
          type: fieldData.type,
          args: fieldData.args || ''
        })
        newFields.push(newFieldRef)
      })

      payload.relationships.forEach((relData) => {
        const newRelRef = db.collection('relationships').doc();
        batch.set(newRelRef, {
          owner: firebase.auth().currentUser.uid,
          name: relData.name,
          to: relData.to,
          type: relData.type,
          args: relData.args || ''
        })
        newRelationships.push(newRelRef)
      })

      //Once the batch completes we can update the model
      return batch.commit().then(function () {
          const updatedModelData = {}
          newFields.forEach(f => updatedModelData[`fields.${f.id}`] = true)
          newRelationships.forEach(r => updatedModelData[`relationships.${r.id}`] = true)

          const modelDoc = db.collection('models').doc(payload.model.id)
          return modelDoc.update(updatedModelData)
      });
    },
    addRelationship: function (_, payload) {
      event('add-relationship', {
        event_category: 'relationship',
        event_label: payload.name,
        value: 1
      })
      return firebase.firestore().collection('relationships').add({
        owner: firebase.auth().currentUser.uid,
        name: payload.name,
        to: payload.to,
        type: payload.type,
        args: payload.args || ''
      }).then((field) => {
        firebase.firestore().collection('models').doc(payload.model).update(
          {[`relationships.${field.id}`]: true}
        )
      })
    },
    moveModelToApp: function (_, payload) {
      event('move-model', {
        event_category: 'model',
        event_label: payload.name,
        value: 1
      })
      var batch = firebase.firestore().batch();
      // Set the value of 'toApp'
      var toRef = firebase.firestore().collection('apps').doc(payload.toApp)
      batch.update(toRef, {[`models.${payload.model}`]: true})
      // Remove the value from fromApp
      var fromRef = firebase.firestore().collection('apps').doc(payload.fromApp)
      batch.update(fromRef, {[`models.${payload.model}`]: firebase.firestore.FieldValue.delete()});
      // Commit the batch
      return batch.commit().then(function () {
        console.log("Moved ", payload.model, 'from', payload.fromApp, 'to', payload.toApp)
      })
    }
  }
})
