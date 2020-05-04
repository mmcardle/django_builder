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
            <v-icon size=50 class="red--text text--darken-4 mr-3 mt-n8" >mdi-file-tree</v-icon>
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
          <a class="d-block" @click="showEditProjectDialog()">
            <span v-if="channels" class="orange--text">
              Django Channels <v-icon class="green--text" >mdi-check-circle</v-icon>
            </span>
            <span v-if="!channels" class="grey--text">
              Django Channels <v-icon class="gray--text" >mdi-close-circle</v-icon>
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
    
    <v-container fluid ref="apps" px-0 >
      <v-row >
        <v-col md="8" hidden-sm-and-down class="py-0 pr-0">
          <directoryview v-bind:id="id" />
        </v-col>
        <template v-if="isloaded">
          <v-col cols="12" md="4" >
            <h2 class="red--text text--darken-4 mx-3">
              <v-icon class="red--text text--darken-4" >mdi-database</v-icon> Project Models
            </h2>
            <v-card elevation="2" class="ma-2 mb-5 mr-5" v-if="Object.keys(this.apps).length == 0">
              <v-card-text class="mb-5">
                <em>Add some apps so you can create models.</em>
              </v-card-text>
            </v-card>
            <div v-for="(app, appid) in this.apps" class="overflow-hidden" :key="appid">
              <v-card elevation="2" class="ma-2 mb-5">
              <v-card-title class="py-0">
                <a class="orange--text text--darken-1" @click="showEditAppDialog(appid)">
                  {{appData(appid).name}}
                </a>
              </v-card-title>
              <v-card-text class="mb-5">
                <drop v-if="Object.keys(draggingModel).length !== 0 && draggingModel.app !== appid"
                  @drop="(modelid) => {dropModeltoApp(appid, modelid)}">
                  <v-alert class="text-center drag-model-location" :value="true" color="primary">
                    Drop model here to move model to {{appData(appid).name}}
                    <div class="mt-3">
                      <v-icon x-large >mdi-chevron-down</v-icon>
                    </div>
                  </v-alert>
                </drop>

                <v-card v-for="model in $store.getters.ordered_models(appid)" :key="model.id + appid"
                  class="mb-5 pt-1 pb-4" elevation="4">
                  <drag :transfer-data="{app: appid, model: model.id}"
                    @drag="dragModel({app: appid, model: model.id})"
                    @dragend="dragModelEnd({app: appid, model: model.id})"
                  >
                  <v-card-title class="py-0">
                    <v-row align="start" justify="start" fill-height>
                      <v-col cols="11" class="py-0">
                        <v-icon class="red--text text--darken-4" >mdi-database</v-icon>
                        <a class="hljs-function"
                          @click="showEditModelDialog(appid, model.id)">
                          {{modelData(model.id).name}}
                          <span class="hljs-params"
                            v-if="modelData(model.id).parents && modelData(model.id).parents.length > 0">
                            ({{modelsParents(model.id)}})
                          </span>
                          <span v-else></span>
                          <v-chip small v-if="modelData(model.id).abstract">Abstract</v-chip>
                        </a>
                      </v-col>
                      <v-col cols="1" class="py-0">
                        <v-icon>mdi-drag</v-icon>
                      </v-col>
                    </v-row>

                  </v-card-title>

                  <v-list dense v-if="Object.keys(modelData(model.id).relationships).length > 0">
                    <v-list-item @click="showEditRelationshipDialog(relationshipid)"  class="mb-1"
                      v-for="(relationship, relationshipid) in modelData(model.id).relationships" ripple
                      :key="relationshipid + appid"
                    >
                      <v-list-item-avatar size="20" style="min-width: 30px">
                        <v-icon>device_hub</v-icon>
                      </v-list-item-avatar>

                      <v-list-item-content>
                        <v-list-item-title class="subheading font-weight-medium">
                          <span class="red--text"> {{relationshipData(relationshipid).name}}</span>
                        </v-list-item-title>
                        <v-list-item-subtitle class="body-2">
                          {{relationshipData(relationshipid).type.split('.').pop()}}
                          (<span class="green--text">{{relationshipData(relationshipid).to.split('.').pop()}}</span>,
                          {{relationshipData(relationshipid).args}})
                        </v-list-item-subtitle>
                      </v-list-item-content>

                      <v-list-item-action>
                        <v-btn icon ripple
                          @click.stop="showDeleteRelationshipDialog(model.id, relationshipid)">
                          <v-icon class="red--text text--darken-4" >mdi-delete</v-icon>
                        </v-btn>
                      </v-list-item-action>

                    </v-list-item>
                  </v-list>

                  <v-list two-line dense v-if="Object.keys(modelData(model.id).fields).length > 0">
                    <v-list-item @click="showEditFieldDialog(fieldid)" ripple
                      v-for="(field, fieldid) in modelData(model.id).fields" :key="fieldid + appid"
                    >
                      <v-list-item-avatar size="20" style="min-width: 30px" class="hidden-xs-only">
                          <v-icon small class="grey--text text--lighten-1" >mdi-circle</v-icon>
                      </v-list-item-avatar>

                      <v-list-item-content class="subheading font-weight-medium">
                        <v-list-item-title>
                          <span class="primary--text">{{fieldData(fieldid).name}}</span>
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{fieldData(fieldid).type.split('.').pop()}}
                          <span class="hidden-xs-only">({{fieldData(fieldid).args}})</span>
                        </v-list-item-subtitle>
                      </v-list-item-content>

                      <v-list-item-action>
                        <v-btn icon ripple red
                          @click.stop="showDeleteFieldDialog(model.id, fieldid)">
                          <v-icon class="red--text text--darken-4" >mdi-delete</v-icon>
                        </v-btn>
                      </v-list-item-action>
                    </v-list-item>
                  </v-list>

                  <v-card-text v-if='Object.keys(modelData(model.id).fields).length + Object.keys(modelData(model.id).relationships).length == 0'>
                    <v-subheader class="ma-1">
                      Add some relationships or fields.
                    </v-subheader>
                    <v-subheader class="ma-1">
                      <v-btn color="info" block @click="showFieldDialog(model.id)">
                        <v-icon>add</v-icon> Add Field <v-icon class="ml-1">fa fa-dot-circle</v-icon>
                      </v-btn>
                    </v-subheader>
                    <v-subheader class="ma-1">
                      <v-btn color="info" block
                        @click="showRelationshipDialog(model.id)">
                        <v-icon>add</v-icon> Add Relationship <v-icon class="ml-1">device_hub</v-icon>
                      </v-btn>
                    </v-subheader>
                  </v-card-text>

                  <v-speed-dial
                    absolute right
                    direction="left"
                    open-on-hover
                    transition="slide-x-reverse-transition"
                  >
                    <template v-slot:activator>
                      <v-btn x-small color="info" dark fab >
                        <v-icon>add</v-icon>
                      </v-btn>
                    </template>

                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn x-small fab dark color="green" @click="showFieldDialog(model.id)" v-on="on">
                          <v-icon>add</v-icon>
                        </v-btn>
                      </template>
                      <span>Add Field</span>
                    </v-tooltip>

                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn x-small fab dark color="warning" @click="showRelationshipDialog(model.id)" v-on="on" >
                          <v-icon>share</v-icon>
                        </v-btn>
                      </template>
                      <span>Add Relationship</span>
                    </v-tooltip>

                  </v-speed-dial>
                  
                  <v-btn fab x-small dark absolute left color="error"
                    @click="showDeleteModelDialog(appid, model.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>

                </drag>
                </v-card>

                <div v-if="Object.keys(appData(appid).models).length === 0" class="mb-3">
                  <v-subheader class="ma-2">
                    Add some models.
                  </v-subheader>
                  <v-subheader class="ma-2">
                    <v-btn color="info" block
                      @click="showModelDialog(appid)">
                      <v-icon>add</v-icon> Add model
                    </v-btn>
                  </v-subheader>
                </div>
              </v-card-text>
              <v-btn fab x-small absolute bottom right color="info" dark @click="showModelDialog(appid)">
                <v-icon>add</v-icon>
              </v-btn>
              <v-btn fab x-small absolute bottom left color="error" @click="showDeleteAppDialog(appid)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card>
            </div>
          </v-col>
        </template>
      </v-row>
    </v-container>

    <!--v-container fluid hidden-md-and-up>
      <template v-for="(renderdata, i) in all_renderers">
        <v-row :key="'app_render_' + i">
        <v-col>
          <v-card class="my-1" elevation="2" :key="'app_render_card_' + i">
            <v-card-title class="ma-0 pb-0">
              <h2 class="blue--text text--darken-4 mx-2">
                <span v-for="(part, i) in renderdata.path.split('/')" v-bind:key="i">
                  <span class="blue-grey--text text--lighten-4" v-if="i !== 0"> / </span>
                  <span :class="i === renderdata.path.split('/').length - 1 ? ['orange--text' , 'text--darken-1'] : ['blue--text', 'text--darken-1']">
                  {{ part }}
                  </span>
                </span>
              </h2>
            </v-card-title>
            <v-card-text class="ma-0 pt-0">
              <highlight-code lang="python">{{renderdata.render()}}</highlight-code>
            </v-card-text>
          </v-card>
        </v-col>
        </v-row>
      </template>
    </v-container-->

  </v-row>
  <v-row v-else  ref="loading" text-center>
    <v-col cols="12">
      <h4 class="title font-weight-medium font-italics">
        Loading ...
      </h4>
    </v-col>
    <v-col>
      <v-icon class="ma-4" color="primary">
        fas fa-circle-notch fa-4x fa-spin
      </v-icon>
    </v-col>
  </v-row>

</template>

<script>
import ImportableModel from '@/components/ImportableModel'
import DirectoryView from '@/components/DirectoryView'
import firebase from 'firebase/app'
import Renderer from '@/django/rendering'
import Django from '@/django/'
import ModelImporter from '@/django/importer'
import {schemas} from '@/schemas/'
import {showDeleteDialog, showFormDialog} from '@/dialogs/'
import 'highlight.js/styles/a11y-light.css'

const renderer = new Renderer()
const django = new Django()

export default {
  props: ['id'],
  components: { 'importable-model': ImportableModel, 'directoryview': DirectoryView},
  data: () => {
    return {
      data: undefined,
      fieldTypes: django.fieldTypes,
      draggingModel: {},
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
    modelsParents: function (model) {
      return this.modelData(model).parents.map(((parent) => {
        if (parent.type == 'user') {
          const model = this.$store.getters.modelData(parent.model)
          return model.name
        } else if (parent.type == 'django') {
          return parent.class.split(".").pop()
        }
      })).join(" ")
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
    dragModel: function (model, _transferData, _nativeEvent) {
      this.draggingModel = model
    },
    dragModelEnd: function (_model, _transferData, _nativeEvent) {
      this.draggingModel = {}
    },
    dropModeltoApp: function (toApp, modelData) {
      this.draggingModel = {}
      const fromApp = modelData.app
      const model = modelData.model
      if (fromApp === toApp) {
        console.error("Not Moving ", model, 'to same app', toApp)
        return
      }
      this.$store.dispatch(
        'moveModelToApp', {
          fromApp: fromApp,
          toApp: toApp,
          model: model
        }
      )
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
        schemas.project,
        this.$store.getters.projectData(this.id)
      )
    },
    showEditAppDialog: function (appid) {
      showFormDialog(
        'Edit application',
        (formdata) => {
          this.$firestore.collection('apps').doc(appid).update(formdata)
        },
        schemas.app,
        {name: this.$store.getters.apps()[appid].data().name}
      )
    },
    showEditModelDialog: function (app, modelid) {
      const modelData = this.$store.getters.modelData(modelid)
      showFormDialog(
        'Edit model',
        (formdata) => {
          this.$firestore.collection('models').doc(modelid).update(formdata)
        },
        this._modelSchemaForApp(),
        {
          name: modelData.name,
          parents: modelData.parents,
          abstract: modelData.abstract
        }
      )
    },
    showEditRelationshipDialog: function (relationshipid) {
      const relationshipData = this.$store.getters.relationships()[relationshipid].data()
      showFormDialog(
        'Edit Relationship',
        (formdata) => {
          this.$firestore.collection('relationships').doc(relationshipid).update(formdata)
        },
        this._relationshipSchemaForApp(),
        {
          name: relationshipData.name,
          to: relationshipData.to,
          type: relationshipData.type,
          args: relationshipData.args
        }
      )
    },
    showEditFieldDialog: function (fieldid) {
      const fieldData = this.$store.getters.fields()[fieldid].data()
      showFormDialog(
        'Edit field',
        (formdata) => {
          this.$firestore.collection('fields').doc(fieldid).update(formdata)
        },
        schemas.field,
        {
          name: fieldData.name,
          type: fieldData.type,
          args: fieldData.args
        }
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
    showDeleteAppDialog: function (appid) {
      showDeleteDialog(
        'Are you sure you wish to delete the app ' + this.appData(appid).name,
        () => {this.deleteApp(appid)}
      )
    },
    showDeleteModelDialog: function (appid, modelid) {
      showDeleteDialog(
        'Are you sure you wish to delete the model ' + this.modelData(modelid).name,
        () => {this.deleteModel(appid, modelid)}
      )
    },
    showDeleteFieldDialog: function (modelid, fieldid) {
      showDeleteDialog(
        'Are you sure you wish to delete the field ' + this.fieldData(fieldid).name,
        () => {this.deleteField(modelid, fieldid)}
      )
    },
    showDeleteRelationshipDialog: function (modelid, relationshipid) {
      showDeleteDialog(
        'Are you sure you wish to delete the relationship ' + this.relationshipData(relationshipid).name,
        () => {this.deleteRelationship(modelid, relationshipid)}
      )
    },
    showAppDialog: function () {
      showFormDialog(
        'Add new application',
        (formdata) => {this.addApp(formdata.name)},
        schemas.app
      )
    },
    _modelSchemaForApp: function () {
      var schema_with_users_models = schemas.model.slice(0)
      const data = this.$store.getters.projectData(this.id)
      Object.keys(data.apps).map((app) => {
        const appData = this.appData(app)
        Object.keys(appData.models).map((modelid) => {
          const modelData = this.modelData(modelid)
          const rel = appData.name + '.models.' + modelData.name
          schema_with_users_models[1].options[rel] = {
            type: 'user', model: modelid, app: app
          }
        })
      })
      return schema_with_users_models
    },
    _relationshipSchemaForApp: function () {
      var schema_with_users_models = schemas.relationship.slice(0)
      const data = this.$store.getters.projectData(this.id)
      Object.keys(data.apps).map((app) => {
        const appData = this.appData(app)
        Object.keys(appData.models).map((modelid) => {
          const modelData = this.modelData(modelid)
          const rel = appData.name + '.' + modelData.name
          schema_with_users_models[1].options[rel] = {}
        })
      })
      return schema_with_users_models
    },
    showModelDialog: function (app) {
      showFormDialog(
        'Add new model',
        (formdata) => {this.addModel(app, formdata.name, formdata.parents, formdata.abstract)},
        this._modelSchemaForApp()
      )
    },
    showRelationshipDialog: function (model) {
      showFormDialog(
        'Add new relationship',
        (formdata) => {
          this.addRelationship(
            model, formdata.name, formdata.to,
            formdata.type, formdata.args
          )
        },
        this._relationshipSchemaForApp()
      )
    },
    showFieldDialog: function (model) {
      showFormDialog(
        'Add new field',
        (formdata) => {
          this.addField(
            model, formdata.name, formdata.type, formdata.args
          )
        },
        schemas.field
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
    addModel: function (app, name, parents, abstract, add_default_fields=true) {
      return this.$store.dispatch(
        'addModel', {
          app: app,
          name: name,
          parents: parents,
          abstract: abstract,
          add_default_fields: add_default_fields
        }
      )
    },
    addField: function (model, name, type, args) {
      return this.$store.dispatch(
        'addField', {
          model: model,
          name: name,
          type: type,
          args: args,
        }
      )
    },
    addRelationship: function (model, name, to, type, args) {
      this.$store.dispatch(
        'addRelationship', {
          model: model,
          name: name,
          to: to,
          type: type,
          args: args,
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
    deleteModel: function (appid, modelid) {
      this.$ga.event({
        eventCategory: 'model',
        eventAction: 'delete-model',
        eventLabel: modelid,
        eventValue: 1
      })
      this.$firestore.collection('apps').doc(appid).update(
        {[`models.${modelid}`]: firebase.firestore.FieldValue.delete()}
      )
    },
    deleteRelationship: function (modelid, relationshipid) {
      this.$ga.event({
        eventCategory: 'relationship',
        eventAction: 'delete-relationship',
        eventLabel: relationshipid,
        eventValue: 1
      })
      this.$firestore.collection('models').doc(modelid).update(
        {[`relationships.${relationshipid}`]: firebase.firestore.FieldValue.delete()}
      )
    },
    deleteField: function (modelid, fieldid) {
      this.$ga.event({
        eventCategory: 'field',
        eventAction: 'delete-field',
        eventLabel: fieldid,
        eventValue: 1
      })
      this.$firestore.collection('models').doc(modelid).update(
        {[`fields.${fieldid}`]: firebase.firestore.FieldValue.delete()}
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
.drag-model-location {
  border-radius: 10px;
  position: absolute;
  z-index: 9999;
  width: 80%;
  top: 40px;
  left: 0;
  right: 0;
  opacity: .8;
}
</style>