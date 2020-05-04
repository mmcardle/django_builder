import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import '@firebase/firestore'
import {keyByValue} from '@/utils'
import { event } from 'vue-analytics'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: undefined,
    loaded: false,
    projects: {},
    apps: {},
    models: {},
    fields: {},
    relationships: {},
    imported_models: []
  },
  getters: {
    user: (state) => () => state.user,
    loaded: (state) => () => state.loaded,
    projects: (state) => () => state.projects,
    projectsData: (state) => () => {
      return Object.keys(state.projects).map((pid) => {
        return Object.assign(state.projects[pid].data(), {id: pid})
      })
    },
    projectData: (state) => (id) => state.projects[id].data(),
    apps: (state) => () => state.apps,
    appData: (state) => (id) => state.apps[id].data(),
    models: (state) => () => state.models,
    modelData: (state) => (id) => state.models[id].data(),
    fields: (state) => () => state.fields,
    relationships: (state) => () => state.relationships,
    ordered_models: (state) => (appid) => {
      const appData = state.apps[appid].data()
      const unordered_models = Object.keys(appData.models).map((model) => {
        return Object.assign(state.models[model].data(), {id: model})
      })
      const models_no_parents = unordered_models.filter((model) => {
        return model.parents.length === 0
      })

      const models_with_parents = unordered_models.filter((model) => {
        return model.parents.length !== 0
      })

      const models_with_parents_sorted = models_with_parents.sort((model, otherModel) => {
        const otherModelParentClasses = otherModel.parents.filter((c) => {
          return c.type !== 'django'
        }).map((c) => {
          return state.models[c.model].data().name
        })
        return otherModelParentClasses.indexOf(model.name) === -1 ? 1 : -1
      })

      return models_no_parents.concat(models_with_parents_sorted)
    },
    imported_models: (state) => () => state.imported_models,
  },
  mutations: {
    set_state (state, payload) {
      Vue.set(state, payload.key, payload.values)
    },
    set_user (state, user) {
      console.log('Loaded', !user.isAnonymous ? user.display_name : 'Anonymous User ' + user.uid)
      state.loaded = true
      state.user = user

      if (user.isAnonymous){
        event({
          eventCategory: 'auth',
          eventAction: 'user-login',
          eventLabel: 'AnonymousLogin',
          eventValue: 1
        })
      } else {
        event({
          eventCategory: 'auth',
          eventAction: 'user-login',
          eventLabel: 'UserLogin',
          eventValue: 1
        })
      }
    },
    logout (state) {
      event({
        eventCategory: 'auth',
        eventAction: 'user-logout',
        eventLabel: 'UserLogout',
        eventValue: 1
      })
      state.user = undefined
      state.loaded = false
      state.projects = {}
      state.apps = {}
      state.models = {}
      state.fields = {}
      state.relationships = {}
    },
    add_imported_models (state, imported_models) {
      event({
        eventCategory: 'model',
        eventAction: 'import-models',
        eventLabel: 'ImportModels',
        eventValue: 1
      })
      state.imported_models = state.imported_models.concat(imported_models)
    },
    remove_imported_model (state, index) {
      event({
        eventCategory: 'model',
        eventAction: 'remove-imported-model',
        eventLabel: state.imported_models[index].name,
        eventValue: 1
      })
      Vue.delete(state.imported_models, index)
    },
  },
  actions: {
    load : function ({commit}, userid) {
      var firestore = firebase.firestore()

      const snapShotErrorHandler = function (err) {
        if (firebase.auth().currentUser) {
          console.log('OnSnapshot error', firebase.auth().currentUser)
          throw err
        } else {
          // This is OK user is no longer logged in'
        }
      }

      const projectPromise = new Promise((resolve) => {
        firestore.collection('projects').where(
          "owner", "==", userid
        ).orderBy("name").onSnapshot((projectData) => {
          commit('set_state', {key: 'projects', values: keyByValue(projectData.docs, "id")})
          resolve()
        }, snapShotErrorHandler)
      })
      const appPromise = new Promise((resolve) => {
        firestore.collection('apps').where(
          "owner", "==", userid
        ).onSnapshot((appData) => {
          commit('set_state', {key: 'apps', values: keyByValue(appData.docs, "id")})
          resolve()
        }, snapShotErrorHandler)
      })

      const modelsPromise = new Promise((resolve) => {
        firestore.collection('models').where(
          "owner", "==", userid
        ).onSnapshot((modelData) => {
          commit('set_state', {key: 'models', values: keyByValue(modelData.docs, "id")})
          resolve()
        }, snapShotErrorHandler)
      })

      const fieldsPromise = new Promise((resolve) => {
        firestore.collection('fields').where(
          "owner", "==", userid
        ).onSnapshot((fieldsData) => {
          commit('set_state', {key: 'fields', values: keyByValue(fieldsData.docs, "id")})
          resolve()
        }, snapShotErrorHandler)
      })

      const relationshipPromise = new Promise((resolve) => {
        firestore.collection('relationships').where(
          "owner", "==", userid
        ).onSnapshot((relationshipData) => {
          commit('set_state', {key: 'relationships', values: keyByValue(relationshipData.docs, "id")})
          resolve()
        }, snapShotErrorHandler)
      })

      const promises = [projectPromise, appPromise, modelsPromise, fieldsPromise, relationshipPromise]
      return Promise.all(promises).then(() => {
        commit('set_user', firebase.auth().currentUser)
      })
    },
    addProject: function (_, payload) {
      event({
        eventCategory: 'project',
        eventAction: 'add-project',
        eventLabel: payload.name,
        eventValue: 1
      })
      return firebase.firestore().collection('projects').add({
        owner: firebase.auth().currentUser.uid,
        name: payload.name,
        description: payload.description,
        channels: payload.channels,
        apps: {}
      })
    },
    addApp: function (_, payload) {
      event({
        eventCategory: 'app',
        eventAction: 'add-app',
        eventLabel: payload.name,
        eventValue: 1
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
    addModel: function ({dispatch}, payload) {
      event({
        eventCategory: 'model',
        eventAction: 'add-model',
        eventLabel: payload.name,
        eventValue: 1
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
        type: 'django.db.models.DateTimeField',
        args: 'auto_now_add=True, editable=False'
      }
      return dispatch('addField', created_field_payload).then(() => {

        const last_updated_field_payload = {
          model: model.id,
          name: 'last_updated',
          type: 'django.db.models.DateTimeField',
          args: 'auto_now=True, editable=False'
        }

        return dispatch('addField', last_updated_field_payload)
      })
    },
    addField: function (_, payload) {
      event({
        eventCategory: 'field',
        eventAction: 'add-field',
        eventLabel: payload.name,
        eventValue: 1
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
      event({
        eventCategory: 'relationship',
        eventAction: 'add-relationship',
        eventLabel: payload.name,
        eventValue: 1
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
      event({
        eventCategory: 'model',
        eventAction: 'move-model',
        eventLabel: payload.name,
        eventValue: 1
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
