<template>
  <v-row  v-if="isloaded">
    <template ref="dialogs"></template>

    <v-toolbar dense v-if="imported_models.length > 0">
      <v-toolbar-title class="toolbar-title px-3" to="/">
        <h3 class="grey--text text--lighten-1 small-caps font-weight-black">
          <span class="blue--text text--darken-2">I</span>mported
          <span class="blue--text text--darken-2">M</span>odels
        </h3>
      </v-toolbar-title>

      <v-toolbar-items >
        <template v-for="(model, i) in imported_models">

          <v-btn text v-bind:key="i" @click="import_dialog = true">
            <v-icon style="font-size:0.8em" class="mr-1">fas fa-database</v-icon>
            {{model.name}}
          </v-btn>

        </template>
      </v-toolbar-items>

      <v-spacer></v-spacer>

      <v-dialog v-model="import_dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-card>
          <v-app-bar flat>
            <v-toolbar-title>
              <django-builder-title />
              -
              <span class="grey--text text--lighten-1 small-caps font-weight-black">
                <span class="blue--text text--darken-2">I</span>mported
                <span class="blue--text text--darken-2">M</span>odels
              </span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click.native="import_dialog = false">
              <v-icon>close</v-icon>
            </v-btn>
          </v-app-bar>

          <v-row fill-height v-if="!importing">
            <v-col pa-2 cols="12" md="6" lg="3" class="mb-3"
              v-for="(model, i) in imported_models" v-bind:key="i" >
              <importable-model v-bind:index="i" v-bind="model"
                v-bind:add="addModelToApp" v-bind:apps="apps"
                v-bind:remove="removeImportedModel"
              />
            </v-col>
          </v-row>
          <v-row v-else  ref="importing" text-center class="ma-3">
            <v-col offset="3" cols="6">
              <h4 class="title font-weight-medium font-italics">
                Importing Model ...
              </h4>
              <v-progress-linear slot="extension" :indeterminate="true" class="ma-2">
              </v-progress-linear>
            </v-col>
            <v-col>
              <v-icon class="ma-4" color="primary">
                fas fa-circle-notch fa-4x fa-spin
              </v-icon>
            </v-col>
          </v-row>

        </v-card>
      </v-dialog>
    </v-toolbar>

    <v-container ref="project_title">
      <v-row  align="center" justify="center" class="text-center">
        <v-col cols="12" md=4 lg=3 v-if="isloaded">
          <!-- Desktop -->
          <div @click="showEditProjectDialog()" class="hidden-xs-only">
            <a class="hljs-title display-3 font-weight-medium red--text text--darken-4 text-capitalize">
              <span class="grey--text text--lighten-1 font-weight-black">
                <span class="red--text text--darken-2">{{name.substring(0,1)}}</span>{{name.substring(1)}}
              </span>
            </a>
          </div>
          <!-- Mobile -->
          <div class="hidden-sm-and-up mt-2">
            <a class="hljs-title display-2 font-weight-medium red--text text--darken-4 text-capitalize"
              @click="showEditProjectDialog()">
              <v-icon size=50 class="red--text text--darken-4 mr-3 mt-n3" >mdi-file-tree</v-icon>
              <span class="grey--text text--lighten-1 font-weight-black">
                <span class="red--text text--darken-2">{{name.substring(0,1)}}</span>{{name.substring(1)}}
              </span>
            </a>
          </div>
          <a class="d-block orange--text" @click="showEditProjectDialog()">
            <span v-if="channels">
              Django Channels <v-icon class="green--text" >mdi-toggle-switch</v-icon>
            </span>
            <span v-else class="grey--text">
              Django Channels <v-icon class="gray--text" >mdi-toggle-switch-off</v-icon>
            </span>
          </a>
        </v-col>
        <template v-if="Object.keys(this.apps).length > 0">
          <v-col cols=12 sm=6 md=4 lg=2>
            <v-btn style="width:95%" large ripple @click="showAppDialog()" class="mx-2">
              <v-icon>add</v-icon> Add App
            </v-btn>
          </v-col>
          <v-col cols=12 sm=6 md=4 lg=2>
            <v-btn style="width:95%" large ripple @click.stop="downloadProject()" class="mx-2">
              <v-icon class=mr-1 color=blue>mdi-cloud-download</v-icon>  Download
            </v-btn>
          </v-col>
          <v-col cols=12 sm=6 md=4 lg=3 offset-md=4 offset-lg=0>
            <v-btn style="width:95%" v-if="importReady" large ripple color="success" type="file" class="mx-2"
              @click="$refs.inputUpload !== undefined ? $refs.inputUpload.click() : () => {}" >
              <v-icon class=mr-1 color=white>mdi-cloud-upload</v-icon> Upload models.py
            </v-btn>
          </v-col>
          <v-col cols=12 sm=6 md=4 lg=2 >
            <input v-show="false" ref="inputUpload" type="file" @change="importModels"
              v-if="importReady" multiple>
            <v-btn style="width:95%" large ripple @click="showDeleteProjectDialog()" color="error" class="mx-2">
              <v-icon>delete</v-icon> Delete
            </v-btn>
          </v-col>
        </template>
        <template v-else>
          <v-col cols=12 sm=5 md=4 lg=3 xl=2>
            <v-btn style="width:95%" v-if="importReady" large ripple color="success" type="file" class="mx-2"
              @click="$refs.inputUpload !== undefined ? $refs.inputUpload.click() : () => {}" >
              <v-icon class=mr-1 color=white>mdi-cloud-upload</v-icon> Upload models.py
            </v-btn>
          </v-col>
          <v-col cols=12 sm=5 md=4 lg=3 xl=2 >
            <input v-show="false" ref="inputUpload" type="file" @change="importModels"
              v-if="importReady" multiple>
            <v-btn style="width:95%" large ripple @click="showDeleteProjectDialog()" color="error" class="mx-2">
              <v-icon>delete</v-icon> Delete
            </v-btn>
          </v-col>
        </template>
      </v-row>
    </v-container>

    <v-container fluid pa-0 ref="empty_apps" v-if="Object.keys(this.apps).length === 0">
      <v-row >
        <v-col cols="12" offset-sm="1" sm="10" offset-md="2" md="8" offset-lg="3" lg="6" offset-xl="4" xl="4">
          <v-card class="pa-3 mt-3 text-center">
            <v-card-text>
              Start your project by adding an App.
            </v-card-text>
            <v-card-text>
              <v-btn large ripple color="primary" @click="showAppDialog()">
                <v-icon>add</v-icon> Add App
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <v-container fluid ref="apps" px-0 v-if="isloaded">
      <v-row no-gutters>
        <directoryview v-bind:id="id" />
        <appview v-bind:id="id" />
      </v-row>
    </v-container>

  </v-row>

  <v-container v-else ref="loading" text-center>
    <v-row>
      <v-col cols="12">
        <h4 class="title font-weight-medium font-italics">
          Loading ...
        </h4>
      </v-col>
      <v-col>
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
  </v-container>

</template>

<script>
import ImportableModel from '@/components/ImportableModel'
import DirectoryView from '@/components/DirectoryView'
import AppView from '@/components/AppView'
import firebase from 'firebase/app'
import Renderer from '@/django/rendering'
import ModelImporter from '@/django/importer'
import {schemas} from '@/schemas/'
import {showDeleteDialog, showFormDialog} from '@/dialogs/'
import 'highlight.js/styles/a11y-light.css'

const renderer = new Renderer()

export default {
  props: ['id'],
  components: { 'importable-model': ImportableModel, 'directoryview': DirectoryView, appview: AppView},
  data: () => {
    return {
      data: undefined,
      import_dialog: false,
      importing: false,
      importReady: true
    }
  },
  computed: {
    renderer: () => renderer,
    all_renderers: function () {
      return renderer.project_flat(this.id)
    },
    isloaded: function () {
      return this.$store.getters.loaded()
    },
    name: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return ''
      return this.$store.getters.projectData(this.id).name
    },
    channels: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return false
      return this.$store.getters.projectData(this.id).channels
    },
    apps: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return []
      return this.$store.getters.projectData(this.id).apps
    },
    imported_models: function () {
      return this.$store.getters.imported_models()
    }
  },
  methods: {
    downloadProject: function () {
      this.$ga.event({
        eventCategory: 'project',
        eventAction: 'download-project',
        eventLabel: this.name,
        eventValue: 1
      })
      const url = renderer.as_tarball(this.id)
      const link = document.createElement("a")
      link.download = this.name + '.tar'
      link.href = url
      document.body.appendChild(link)
      link.click()
      return url
    },
    importModels: function (e) {
      this.import_dialog = true
      this.importReady = false
      const importer = new ModelImporter()
      importer.import_models(e.target.files).then((results) => {
        const modelList = []
        results.forEach((result) => {
          result.models.forEach((model) => {
            model['file'] = result.file.name
            modelList.push(model)
          })
        })
        this.$store.commit('add_imported_models', modelList)
        this.$nextTick(() => {
          this.importReady = true
        })
      })
    },
    appData: function (appid) {
      return this.$store.getters.apps()[appid].data()
    },
    modelData:  function (modelid) {
      return this.$store.getters.modelData(modelid)
    },
    relationshipData:  function (relationshipid) {
      return this.$store.getters.relationships()[relationshipid].data()
    },
    fieldData:  function (fieldid) {
      return this.$store.getters.fields()[fieldid].data()
    },
    showEditProjectDialog: function () {
      showFormDialog(
        'Edit Project',
        (formdata) => {
          this.$firestore.collection('projects').doc(this.id).update(formdata)
        },
        schemas.project(),
        this.$store.getters.projectData(this.id)
      )
    },
    showDeleteProjectDialog: function () {
      this.$router.push({ name: 'Home' })
      showDeleteDialog(
        'Are you sure you wish to delete the project ' + this.name,
        () => {this.deleteProject(this.id)},
        () => {this.$router.push({ name: 'Project', params: { id: this.id }})}
      )
    },
    showAppDialog: function () {
      showFormDialog(
        'Add new application',
        (formdata) => {this.addApp(formdata.name)},
        schemas.app()
      )
    },
    addApp: function (name) {
      this.$store.dispatch(
        'addApp', {
          project: this.id,
          name: name
        }
      )
    },
    deleteProject: function (pid) {
      this.$firestore.collection("projects").doc(pid).delete()
    },
    deleteApp: function (appid) {
      this.$ga.event({
        eventCategory: 'app',
        eventAction: 'delete-app',
        eventLabel: appid,
        eventValue: 1
      })
      this.$firestore.collection('projects').doc(this.id).update(
        {[`apps.${appid}`]: firebase.firestore.FieldValue.delete()}
      )
    },
    addModelToApp: function (app, model_index) {
      this.importing = true
      const modelData =  this.imported_models[model_index]
      // TODO - add correct parents
      this.addModel(
        app, modelData.name, [], modelData.abstract,
        false
      ).then((model) => {
        return this.$store.dispatch(
          'addFieldsAndRelationships', {
            model: model,
            fields: modelData.fields,
            relationships: modelData.relationships
          }
        ).then(() => {
          this.importing = false
          console.log('Added model', modelData, model)
        })
      })
    },
    removeImportedModel: function (i) {
      this.$store.commit('remove_imported_model', i)
    },
  },
}
</script>
<style>
.hljs {
  color: #545454 !important;
  padding: 0;
  background: white !important;
  width: 100%;
  height: 100%;
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
}
code:before, .hljs:before {
  content: "" !important;
}
</style>