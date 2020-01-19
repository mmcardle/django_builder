<template>
  <v-layout row wrap v-if="isloaded">

    <template ref="dialogs"></template>

    <v-toolbar dense flat absolute v-if="imported_models.length > 0">
      <v-toolbar-title to="/">
        <span class="grey--text text--lighten-1 small-caps font-weight-black">
          <span class="blue--text text--darken-2">I</span>mported
          <span class="blue--text text--darken-2">M</span>odels
        </span>
      </v-toolbar-title>

      <v-toolbar-items>
        <template v-for="(model, i) in imported_models">

          <v-btn flat v-bind:key="i" @click="import_dialog = true">
            <v-icon style="font-size:0.8em" class="mr-1">fas fa-database</v-icon>
            {{model.name}}
          </v-btn>

        </template>
      </v-toolbar-items>

      <v-spacer></v-spacer>

      <v-dialog v-model="import_dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-toolbar-side-icon slot="activator"></v-toolbar-side-icon>
        <v-card>
          <v-toolbar flat>
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
          </v-toolbar>

          <v-layout row wrap fill-height v-if="!importing">
            <v-flex pa-2 xs12 md6 lg3 class="mb-3"
              v-for="(model, i) in imported_models" v-bind:key="i" >
              <importable-model v-bind:index="i" v-bind="model"
                v-bind:add="addModelToApp" v-bind:apps="apps"
                v-bind:remove="removeImportedModel"
              />
            </v-flex>
          </v-layout>
          <v-layout v-else row wrap ref="importing" text-xs-center class="ma-3">
            <v-flex offset-xs3 xs6>
              <h4 class="title font-weight-medium font-italics">
                Importing Model ...
              </h4>
              <v-progress-linear slot="extension" :indeterminate="true" class="ma-2">
              </v-progress-linear>
            </v-flex>
            <v-flex>
              <v-icon class="ma-4" color="primary">
                fas fa-circle-notch fa-4x fa-spin
              </v-icon>
            </v-flex>
          </v-layout>

        </v-card>
      </v-dialog>
    </v-toolbar>

    <v-container fluid pa-0 ref="project_title">
      <v-layout row wrap align-center justify-center class="text-xs-center">
        <v-flex pl-2 xs12 md4 v-if="isloaded"  >
          <!-- Desktop -->
          <a class="hidden-xs-only hljs-title display-3 font-weight-medium red--text text--darken-4 text-capitalize"
            @click="showEditProjectDialog()">
            <font-awesome-icon class="red--text text--darken-4 mr-3" icon="project-diagram" />
            <span class="grey--text text--lighten-1 font-weight-black">
              <span class="red--text text--darken-2">{{name.substring(0,1)}}</span>{{name.substring(1)}}
            </span>
          </a>
          <!-- Mobile -->
          <div class="hidden-sm-and-up mt-2">
            <a class="hljs-title display-1 font-weight-medium red--text text--darken-4 text-capitalize"
              @click="showEditProjectDialog()">
              <font-awesome-icon class="red--text text--darken-4 mr-3" icon="project-diagram" />
              <span class="grey--text text--lighten-1 font-weight-black">
                <span class="red--text text--darken-2">{{name.substring(0,1)}}</span>{{name.substring(1)}}
              </span>
            </a>
          </div>
        </v-flex>
        <v-flex v-if="Object.keys(this.apps).length > 0">
          <v-btn large ripple @click="showAppDialog()">
            Add App
          </v-btn>
          <v-btn large ripple @click.stop="downloadProject()">
            Download
          </v-btn>
          <v-btn v-if="importReady" large ripple color="success" type="file"
            @click="$refs.inputUpload !== undefined ? $refs.inputUpload.click() : () => {}" >
            Upload models.py
          </v-btn>
          <input v-show="false" ref="inputUpload" type="file" @change="importModels"
            v-if="importReady" multiple>
          <v-btn large ripple @click="showDeleteProjectDialog()" color="error">
            Delete
          </v-btn>
        </v-flex>
        <v-flex row wrap v-else>
          <v-btn color="success" ripple large @click="$refs.inputUpload.click()" type="file" >
            Upload models.py
          </v-btn>
          <input v-show="false" ref="inputUpload" type="file" @change="importModels" multiple>
          <v-btn large ripple @click="showDeleteProjectDialog()" color="error">
            Delete Project
          </v-btn>
        </v-flex>
      </v-layout>
    </v-container>

    <v-container fluid pa-0 ref="empty_apps" v-if="Object.keys(this.apps).length === 0">
      <v-layout row wrap>
        <v-flex xs12 offset-sm1 sm10 offset-md2 md8 offset-lg3 lg6 offset-xl4 xl4>
          <v-card class="pa-3 mt-3 text-xs-center">
            <v-card-text>
              Start your project by adding an App.
            </v-card-text>
            <v-card-text>
              <v-btn large ripple color="primary" @click="showAppDialog()">
                Add App
              </v-btn>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>

    <v-container fluid ref="apps" px-5>
      <v-layout row wrap  justify-center>
        <template v-if="isloaded">
          <v-flex xs12 sm10 md6 lg4 xl3 v-for="(app, appid) in this.apps"
            class="overflow-hidden" :key="appid">
            <v-card elevation="6" class="ma-2 mb-4">
              <v-card-title>
                <h2>
                  <a class="orange--text text--darken-1" @click="showEditAppDialog(appid)">
                    {{appData(appid).name}}
                  </a>
                </h2>
              </v-card-title>
              <v-card-text class="mb-2">
                <drop v-if="Object.keys(draggingModel).length !== 0 && draggingModel.app !== appid"
                  @drop="(modelid) => {dropModeltoApp(appid, modelid)}">
                  <v-alert class="text-xs-center drag-model-location" :value="true" color="primary">
                    Drop model here to move model to {{appData(appid).name}}
                    <div class="mt-3">
                      <font-awesome-icon class="fa-4x" icon="caret-square-down" />
                      <v-icon x-large color="white">fas fa-caret-square-down</v-icon>
                    </div>
                  </v-alert>
                </drop>

                <v-card v-for="model in $store.getters.ordered_models(appid)" :key="model.id + appid"
                  class="mb-5 pa-2" elevation="8">
                  <drag :transfer-data="{app: appid, model: model.id}"
                    @drag="dragModel({app: appid, model: model.id})"
                    @dragend="dragModelEnd({app: appid, model: model.id})"
                  >
                  <div>
                    <v-layout align-start justify-start row fill-height >
                      <v-flex xs11>
                        <h2>
                          <font-awesome-icon icon="database" />
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
                        </h2>
                      </v-flex>
                      <v-flex xs1>
                        <font-awesome-icon class="grey--text lighten-2" icon="grip-horizontal" />
                      </v-flex>
                    </v-layout>

                  </div>

                  <v-list dense>
                    <v-list-tile @click="showEditRelationshipDialog(relationshipid)"  class="mb-1"
                      v-for="(relationship, relationshipid) in modelData(model.id).relationships" ripple
                      :key="relationshipid + appid"
                    >
                      <v-list-tile-avatar size="20" style="min-width: 30px">
                        <v-icon>device_hub</v-icon>
                      </v-list-tile-avatar>

                      <v-list-tile-content>
                        <v-list-tile-title class="subheading font-weight-medium">
                          <span class="red--text"> {{relationshipData(relationshipid).name}}</span>
                        </v-list-tile-title>
                        <v-list-tile-sub-title class="body-2">
                          {{relationshipData(relationshipid).type.split('.').pop()}}
                          (<span class="green--text">{{relationshipData(relationshipid).to.split('.').pop()}}</span>,
                          {{relationshipData(relationshipid).args}})
                        </v-list-tile-sub-title>
                      </v-list-tile-content>

                      <v-list-tile-action>
                        <v-btn icon ripple
                          @click.stop="showDeleteRelationshipDialog(model.id, relationshipid)">
                          <font-awesome-icon icon="trash" class="red--text text--darken-4" />
                        </v-btn>
                      </v-list-tile-action>

                    </v-list-tile>
                  </v-list>

                  <v-list two-line dense>
                    <v-list-tile @click="showEditFieldDialog(fieldid)" ripple
                      v-for="(field, fieldid) in modelData(model.id).fields" :key="fieldid + appid"
                    >
                      <v-list-tile-avatar size="20" style="min-width: 30px" class="hidden-xs-only">
                        <font-awesome-icon icon="circle" class="grey--text text--lighten-1" />
                      </v-list-tile-avatar>

                      <v-list-tile-content class="subheading font-weight-medium">
                        <v-list-tile-title>
                          <span class="primary--text">{{fieldData(fieldid).name}}</span>
                        </v-list-tile-title>
                        <v-list-tile-sub-title>
                          {{fieldData(fieldid).type.split('.').pop()}}
                          <span class="hidden-xs-only">({{fieldData(fieldid).args}})</span>
                        </v-list-tile-sub-title>
                      </v-list-tile-content>

                      <v-list-tile-action>
                        <v-btn icon ripple
                          @click.stop="showDeleteFieldDialog(model.id, fieldid)">
                          <font-awesome-icon icon="trash" class="red--text text--darken-4" />
                        </v-btn>
                      </v-list-tile-action>
                    </v-list-tile>
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

                  <v-speed-dial absolute right direction="left"
                   open-on-hover transition="slide-x-reverse-transition">
                    <v-btn slot="activator" color="primary" dark icon class="mt-0" small>
                      <v-icon>apps</v-icon>
                    </v-btn>

                    <v-tooltip top>
                      <v-btn small icon color="info" slot="activator" class="mt-0"
                        @click="showFieldDialog(model.id)">
                        <v-icon>add</v-icon>
                      </v-btn>
                      <span> Add Field</span>
                    </v-tooltip>

                    <v-tooltip top>
                      <v-btn small icon color="info" slot="activator" class="mt-0"
                        @click="showRelationshipDialog(model.id)">
                        <v-icon>device_hub</v-icon>
                      </v-btn>
                      <span> Add Relationship</span>
                    </v-tooltip>

                  </v-speed-dial>

                  <v-btn small absolute bottom left icon color="error"
                    @click="showDeleteModelDialog(appid, model.id)">
                    <font-awesome-icon icon="trash" />
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
              <v-btn small absolute bottom right round color="info" dark class="ml-4"
                @click="showModelDialog(appid)">
                <v-icon>add</v-icon> Model
              </v-btn>
              <v-btn small absolute bottom left icon color="error"
                @click="showDeleteAppDialog(appid)">
                <font-awesome-icon icon="trash" />
              </v-btn>
            </v-card>
          </v-flex>
        </template>
      </v-layout>
    </v-container>

    <v-container fluid ref="rendered_files" pa-0 v-if="Object.keys(this.apps).length > 0">
      <v-layout row wrap justify-space-around >
        <template v-for="(app, appid) in this.apps">
          <template v-for="render_name in renderer.app_renderers()">
             <v-card class="ma-2" elevation="10" :key="'app_render_' + render_name + appid">
              <v-card-title class="ma-0 pb-0">
                <h3>
                  <span>{{name}}</span>
                  <span class="blue-grey--text text--lighten-4"> / </span>
                  <span class="blue--text text--darken-1">{{appData(appid).name}}</span>
                  <span class="blue-grey--text text--lighten-4"> / </span>
                  <span class="orange--text text--darken-1">{{render_name}}</span>
                </h3>
              </v-card-title>
              <v-card-text class="ma-0 pt-0">
                <highlight-code lang="python">{{renderer.app_render(render_name, appid)}}</highlight-code>
              </v-card-text>
            </v-card>
          </template>
          <template v-for="render_name in renderer.test_renderers()">
             <v-card class="ma-2" elevation="10" :key="render_name + appid">
              <v-card-title class="ma-0 pb-0">
                <h3>
                  <span>{{name}}</span>
                  <span class="blue-grey--text text--lighten-4"> / </span>
                  <span>tests</span>
                  <span class="blue-grey--text text--lighten-4"> / </span>
                  <span class="blue--text text--darken-1">{{appData(appid).name}}</span>
                  <span class="blue-grey--text text--lighten-4"> / </span>
                  <span class="orange--text text--darken-1">{{render_name}}</span>
                </h3>
              </v-card-title>
              <v-card-text class="ma-0 pt-0">
                <highlight-code lang="python">{{renderer.test_render(render_name, appid)}}</highlight-code>
              </v-card-text>
            </v-card>
          </template>
          <template v-for="render_name in renderer.project_renderers()">
             <v-card class="ma-2 overflow-hidden" elevation="10" :key="render_name + appid">
              <v-card-title class="ma-0 pb-0">
                <h3>
                  <span>{{name}}</span>
                  <span class="blue-grey--text text--lighten-4"> / </span>
                  <span class="orange--text text--darken-1">{{render_name}}</span>
                </h3>
              </v-card-title>
              <v-card-text class="ma-0 pt-0">
                <highlight-code lang="python">{{renderer.project_render(render_name, id)}}</highlight-code>
              </v-card-text>
            </v-card>
          </template>
          <template v-for="render_name in renderer.root_renderers()">
             <v-card class="ma-2" elevation="10" :key="render_name + appid">
              <v-card-title class="ma-0 pb-0">
                <h3>
                  <span class="orange--text text--darken-1">{{render_name}}</span>
                </h3>
              </v-card-title>
              <v-card-text class="ma-0 pt-0">
                <highlight-code lang="python">{{renderer.root_render(render_name, id)}}</highlight-code>
              </v-card-text>
            </v-card>
          </template>
          <template v-for="render_name in renderer.template_renderers()">
            <template v-for="model in $store.getters.ordered_models(appid)">
               <v-card class="ma-2" elevation="10" :key="render_name + model.id">
                <v-card-title class="ma-0 pb-0">
                  <h3>
                    <span>{{name}}</span>
                    <span class="blue-grey--text text--lighten-4"> / </span>
                    <span class="blue--text text--darken-1">{{appData(appid).name}}</span>
                    <span class="blue-grey--text text--lighten-4"> / </span>
                    <span class="blue--text text--darken-1">templates</span>
                    <span class="blue-grey--text text--lighten-4"> / </span>
                    <span class="blue--text text--darken-1">{{appData(appid).name}}</span>
                    <span class="blue-grey--text text--lighten-4"> / </span>
                    <span class="orange--text text--darken-1">{{model.name}}_{{render_name}}</span>
                  </h3>
                </v-card-title>
                <v-card-text class="ma-0 pt-0">
                  <highlight-code lang="python">
                    {{renderer.template_render(render_name, appid, model.id)}}
                  </highlight-code>
                </v-card-text>
              </v-card>
            </template>
          </template>
        </template>
        <template v-for="(render_name, i) in renderer.root_template_renderers()">
           <v-card class="ma-2" elevation="10" :key="render_name">
            <v-card-title class="ma-0 pb-0">
              <h3>
                <span>{{name}}</span>
                <span class="blue-grey--text text--lighten-4"> / </span>
                <span class="blue--text text--darken-1">templates</span>
                <span class="blue-grey--text text--lighten-4"> / </span>
                <span class="orange--text text--darken-1">{{render_name}}</span>
              </h3>
            </v-card-title>
            <v-card-text class="ma-0 pt-0">
              <highlight-code lang="python">
                {{renderer.root_template_render(render_name, id)}}
              </highlight-code>
            </v-card-text>
          </v-card>
        </template>
      <!--{{this.id}}: {{this.data}}-->
      </v-layout>
    </v-container>

  </v-layout>
  <v-layout v-else row wrap ref="loading" text-xs-center>
    <v-flex xs12>
      <h4 class="title font-weight-medium font-italics">
        Loading ...
      </h4>
    </v-flex>
    <v-flex>
      <v-icon class="ma-4" color="primary">
        fas fa-circle-notch fa-4x fa-spin
      </v-icon>
    </v-flex>
  </v-layout>

</template>

<script>
import ImportableModel from '@/components/ImportableModel'
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
  components: { 'importable-model': ImportableModel },
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
    isloaded: function () {
      return this.$store.getters.loaded()
    },
    name: function () {
      if (this.$store.getters.projectData(this.id) === undefined) return ''
      return this.$store.getters.projectData(this.id).name
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
  background: white !important;
}
code {
  box-shadow: none;
  -webkit-box-shadow: none;
}
code:before {
  content: "";
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
