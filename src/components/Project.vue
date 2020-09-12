<template>
  <v-row  v-if="isloaded">
    <template ref="dialogs"></template>

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
            <span >
              Django Version: {{django_version}}
            </span>
          </a>
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
          <v-col cols=12 sm=4 md=2 lg=2>
            <v-btn style="width:95%" large ripple @click="showAppDialog()" class="mx-2">
              <v-icon>add</v-icon> Add App
            </v-btn>
          </v-col>
          <v-col cols=12 sm=4 md=3 lg=2>
            <v-btn style="width:95%" large ripple @click.stop="downloadProject()" class="mx-2">
              <v-icon class=mr-1 color=blue>mdi-cloud-download</v-icon>  Download
            </v-btn>
          </v-col>
          <v-col cols=12 sm=4 md=2 lg=2 >
            <v-btn style="width:95%" large ripple @click="showDeleteProjectDialog()" color="error" class="mx-2">
              <v-icon>delete</v-icon> Delete
            </v-btn>
          </v-col>
        </template>
        <template v-else>
          <!--v-col cols=12 sm=5 md=4 lg=3 xl=2>
            <v-btn style="width:95%" v-if="importReady" large ripple color="success" type="file" class="mx-2"
              @click="$refs.inputUpload !== undefined ? $refs.inputUpload.click() : () => {}" >
              <v-icon class=mr-1 color=white>mdi-cloud-upload</v-icon> Upload models.py
            </v-btn>
          </v-col-->
          <v-col cols=12 sm=5 md=4 lg=3 xl=2 >
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

  <v-container v-else-if="error">
    <v-dialog v-model="error_dialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="primary white--text">
          <span class="white--text headline">
            <v-icon large color="white" class="mr-2">mdi-information</v-icon>
            Sorry there has been an error loading.
          </span>
        </v-card-title>
        <v-card-text>
          <div class="pt-4">
            Details of the error are as follows: 
            <p class="my-4">
              <em>{{error.message}}</em>
            </p>
            Please state this error when reporting any issues.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>

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
import DirectoryView from '@/components/DirectoryView'
import AppView from '@/components/AppView'
import firebase from 'firebase/app'
import Renderer from '@/django/rendering'
import ModelImporter from '@/django/importer'
import { DEFAULT_DJANGO_VERSION } from '@/django'
import {schemas} from '@/schemas'
import {showDeleteDialog, showFormDialog} from '@/dialogs/'
import 'highlight.js/styles/a11y-light.css'

const renderer = new Renderer()

export default {
  props: ['id'],
  components: {directoryview: DirectoryView, appview: AppView},
  data: () => {
    return {
      data: undefined,
      import_dialog: false,
      importing: false,
      importReady: true,
      error_dialog: true,
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
    error: function () {
      return this.$store.getters.error()
    },
    name: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return ''
      return this.$store.getters.projectData(this.id).name
    },
    channels: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return false
      return this.$store.getters.projectData(this.id).channels
    },
    django_version: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return '?'
      return this.$store.getters.projectData(this.id).django_version || DEFAULT_DJANGO_VERSION
    },
    apps: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return []
      return this.$store.getters.projectData(this.id).apps
    },
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