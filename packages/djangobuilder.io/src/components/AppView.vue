<template>
  <v-col cols="12" md="4" order-sm="1" order-md="2">

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
          <v-btn icon @click="import_dialog = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-app-bar>

        <v-row fill-height v-if="!importing">
          <v-col pa-4 cols="2" class="mb-3">
            <v-btn block color="primary" @click="addAllModelsToApp()" class="ma-2">
              <v-icon>add</v-icon> Add All {{imported_models.length}} Models
            </v-btn>
          </v-col>
        </v-row>

        <v-row fill-height v-if="!importing">
          <v-col pa-2 cols="12" md="6" lg="3" class="mb-3"
            v-for="(model, i) in imported_models" v-bind:key="i" >
            <importable-model v-bind:index="i" v-bind="model"
              v-bind:add="addModelToApp" v-bind:apps="apps"
            />
          </v-col>
        </v-row>
        <v-row v-else  ref="importing" text-center class="ma-3">
          <v-col offset="3" cols="6">
            <h4 class="text-h6 font-weight-medium font-italics">
              Importing Models - {{num_imported}}/{{imported_models.length}} complete ...
            </h4>
            <template v-slot:extension>
              <v-progress-linear  :value="importing_percent" class="ma-2">
              </v-progress-linear>
            </template>
          </v-col>
          <v-col>
            <v-icon class="ma-4" color="primary">
              fas fa-circle-notch fa-4x fa-spin
            </v-icon>
          </v-col>
        </v-row>

      </v-card>
    </v-dialog>

    <h2 class="red--text text--darken-4 mx-3">
      <v-icon class="red--text text--darken-4">mdi-database</v-icon>Project Models
    </h2>

    <v-card class="ma-2 mb-5 mr-5" v-if="Object.keys(this.apps).length == 0">
      <v-card-text class="mb-5">
        <em>Add some apps so you can create models.</em>
      </v-card-text>
    </v-card>

    <div v-if="!import_dialog">
    <div v-for="(app, appid) in this.apps" class="overflow-hidden" :key="appid">
      <v-card class="ma-2 mb-5">
        <v-card-title class="pb-0 pt-2">
          <v-icon class="blue--text text--darken-4 mr-1">mdi-folder</v-icon>
          <a class="blue--text text--darken-1" @click="showEditAppDialog(appid)">{{app.name}}</a>
          <v-btn v-if="$store.getters.ordered_models(appid).length > 4" fab x-small color="info" dark @click="showModelDialog(appid)" class="ml-4">
            <v-icon>add</v-icon>
          </v-btn>
          <v-btn v-if="$store.getters.ordered_models(appid).length > 4" fab x-small absolute right color="error" @click="showDeleteAppDialog(appid)" class="mb-2 mr-5">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="mb-5 pt-2 pb-4">

          <div v-if="movingModel !== undefined && movingModel.app !== appid" @click="moveModelToApp(appid)" style="cursor: pointer">
            <v-alert class="white--text" :value="true" color="primary" type=info>
              <v-btn class="mt-2" color="error" absolute right top fab x-small @click="clearMoveModel"><v-icon x-small>mdi-close</v-icon></v-btn>
              Click here to move
              <span class="orange--text2 text--darken-3 font-weight-bold">{{appData(movingModel.app).name}}</span>.<span class="orange--text">{{modelData(movingModel.model).name}}
              </span>
              to
              <span class="orange--text2 text--darken-3 font-weight-bold">{{app.name}}</span>.<span class="orange--text">{{modelData(movingModel.model).name}}
              </span>
            </v-alert>
          </div>

          <v-card
            v-for="model in $store.getters.ordered_models(appid)"
            :key="model.name + appid"
            class="mb-2 pt-1 pb-1"
            elevation="0"
          >

            <v-speed-dial absolute right direction="left" open-on-hover transition="slide-x-reverse-transition">
              <template v-slot:activator>
                <v-btn x-small color="info" right dark fab>
                  <v-icon>mdi-cogs</v-icon>
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
                  <v-btn x-small fab dark color="warning" @click="showRelationshipDialog(model.id)" v-on="on">
                    <v-icon>share</v-icon>
                  </v-btn>
                </template>
                <span>Add Relationship</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn x-small fab dark color="info" @click="moveModel(appid, model.id)" v-on="on">
                    <v-icon>mdi-folder-move</v-icon>
                  </v-btn>
                </template>
                <span>Move Model</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn x-small fab dark color="error" @click="showDeleteModelDialog(appid, model.id)" v-on="on">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
                <span>Delete Model</span>
              </v-tooltip>
            </v-speed-dial>

            <v-card-title class="py-0">
              <v-icon class="red--text text--darken-4 mr-1">mdi-database</v-icon>
              <a class="orange--text text--darken-3" @click="showEditModelDialog(appid, model.id)">
                {{model.name}}
                <span
                  class="hljs-params"
                  v-if="model.parents && model.parents.length > 0"
                >({{modelsParents(model)}})</span>
                <span v-else></span>
                <v-chip small v-if="model.abstract">Abstract</v-chip>
              </a>
            </v-card-title>

            <v-list v-if="Object.keys(model.relationships).length > 0" class="py-0">
              <v-list-item
                @click="showEditRelationshipDialog(relationshipid)"
                class="mb-1"
                v-for="(_, relationshipid) in model.relationships"
                ripple 
                :key="relationshipid + appid"
              >
                <v-list-item-avatar size="20" style="min-width: 30px">
                  <v-icon>device_hub</v-icon>
                </v-list-item-avatar>

                <v-list-item-content class="py-0">
                  <v-list-item-title class="subheading font-weight-medium">
                    <span class="red--text">{{relationshipData(relationshipid).name}}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-body-2">
                    {{relationshipData(relationshipid).type.split('.').pop()}}
                    (
                    <span
                      class="green--text"
                    >{{relationshipData(relationshipid).to.split('.').pop()}}</span>
                    ,{{relationshipData(relationshipid).args}})
                  </v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn icon ripple @click.stop="showDeleteRelationshipDialog(model.id, relationshipid)">
                    <v-icon small class="red--text text--darken-4">mdi-delete</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>

            <v-list v-if="Object.keys(model.fields).length > 0" class="py-0">
              <v-list-item
                @click="showEditFieldDialog(fieldid)"
                ripple
                v-for="(_, fieldid) in model.fields"
                :key="fieldid + appid"
                >
                <v-list-item-avatar size="20" style="min-width: 30px" class="hidden-xs-only">
                  <v-icon small class="grey--text text--lighten-1">mdi-circle</v-icon>
                </v-list-item-avatar>

                <v-list-item-content class="py-0 subheading font-weight-medium">
                  <v-list-item-title>
                    <span class="primary--text">{{fieldData(fieldid).name}}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{fieldData(fieldid).type.split('.').pop()}}
                    <span
                      class="hidden-xs-only"
                    >({{fieldData(fieldid).args}})</span>
                  </v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn icon ripple red @click.stop="showDeleteFieldDialog(model.id, fieldid)">
                    <v-icon small class="red--text text--darken-4">mdi-delete</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>

            <v-card-text
              v-if="model.fields.length + model.relationships.length == 0"
            >
              <v-subheader class="ma-1">Add some relationships or fields.</v-subheader>
              <v-subheader class="ma-1">
                <v-btn color="info" block @click="showFieldDialog(model.id)">
                  <v-icon>add</v-icon>Add Field
                  <v-icon class="ml-1">fa fa-dot-circle</v-icon>
                </v-btn>
              </v-subheader>
              <v-subheader class="ma-1">
                <v-btn color="info" block @click="showRelationshipDialog(model.id)">
                  <v-icon>add</v-icon>Add Relationship
                  <v-icon class="ml-1">device_hub</v-icon>
                </v-btn>
              </v-subheader>
            </v-card-text>
          </v-card>

          <div v-if="$store.getters.ordered_models(appid).length == 0" class="mb-3">
            <v-subheader class="ma-2">Add some models.</v-subheader>
            <v-subheader class="ma-2">
              <v-btn color="info" block @click="showModelDialog(appid)">
                <v-icon>add</v-icon>Add model
              </v-btn>
            </v-subheader>
          </div>
        </v-card-text>
        
        <input ref="inputUpload" v-show="false" type="file" @change="importModels" multiple>
        
        <v-btn fab x-small absolute bottom right color="info" dark @click="showModelDialog(appid)" class="mb-1 mr-4">
          <v-icon>add</v-icon>
        </v-btn>
        <v-btn fab x-small absolute bottom left color="error" @click="showDeleteAppDialog(appid)" class="mb-1">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-card>
    </div>
    </div>
  </v-col>
</template>

<script>
import firebase from 'firebase/compat/app';
import { schemas } from "@/schemas";
import ImportableModel from '@/components/ImportableModel.vue'
import { ModelImporter } from "@djangobuilder/core"
import { showDeleteDialog, showFormDialog, showMessageDialog } from "@/dialogs/";
import { MAX_BATCH_IMPORTABLE_MODELS, MAX_MODELS } from '@/constants'
import { batchModelsForTransaction } from '@/utils'
import "highlight.js/styles/a11y-light.css";

export default {
  props: ["id"],
  components: { 'importable-model': ImportableModel },
  data: () => {
    return {
      movingModel: undefined,
      importReady: false,
      import_dialog: false,
      importing: false,
      importingForApp: undefined,
      importing_percent: 0,
      num_imported: 0,
      imported_models: []
    };
  },
  computed: {
    apps: function() {
      const appKeys = Object.keys(this.$store.getters.projectData(this.id).data().apps)
      const apps = {}
      appKeys.forEach(appKey => {
        apps[appKey] = this.$store.getters.appData(appKey)
      })
      return apps
    }
  },
  methods: {
    appId: function(app) {
      return this.$store.getters.appIdMap()[app];
    },
    checkCanAddNModels: function (n) {
      return this.$store.getters.ordered_models(this.importingForApp).length + n < MAX_MODELS
    },
    tooManyModels: function () {
      showMessageDialog(
        "Sorry, Too many models.",
        "Sorry you have too many models in this app, maximum is " + MAX_MODELS + ".",
        () => {},
      );
    },
    addAllModelsToApp: function () {
      if (!this.checkCanAddNModels(this.imported_models.length)) {
        this.tooManyModels();
        return
      }
      this.importing = true
      const batchOfModels = batchModelsForTransaction(this.imported_models, MAX_BATCH_IMPORTABLE_MODELS);
      const promises = batchOfModels.map((modelBatch, i) => {
        console.debug('Started import models batch number', i)
        return this.$store.dispatch("addModels", modelBatch).then(() => {
          this.num_imported += modelBatch.length;
          this.importing_percent = (this.num_imported / this.imported_models.length) * 100;
          console.debug('Completed import models batch number', i, ',', modelBatch.length, 'models', this.num_imported, this.importing_percent)
          this.$forceUpdate();
        })
      })
      return Promise.all(promises).then(() => {
        console.debug('Completed importing', batchOfModels.length , 'batches', this.imported_models.length, 'models')
        this.importing = false
        this.imported_models = [];
        this.importing_percent = 0;
        this.import_dialog = false;
      })
    },
    addModelToApp: function (modelData) {
      if (!this.checkCanAddNModels(1)) {
        this.tooManyModels();
        return
      }
      this.importing = true
      // TODO - add correct parents
      this.addModel(
        modelData.app, modelData.name, [], modelData.abstract,
        false
      ).then((model) => {
        return this.$store.dispatch(
          'addFieldsAndRelationships', {
            model: model,
            fields: modelData.fields,
            relationships: modelData.relationships
          }
        ).then(() => {
          console.log('Added model', modelData, model)
          this.importing = false
          this.imported_models.splice(modelData.index, 1);
          this.import_dialog = this.imported_models.length !== 0
        })
      })
    },
    importModels: async function (e) {
      this.import_dialog = true
      this.importReady = false
      const importer = new ModelImporter()
      const file_reader_promises = Array.prototype.map.call(e.target.files, (file) => {
        return new Promise((resolve, reject) => {
          const file_reader = new FileReader()
          file_reader.onload = () => {
            resolve(file_reader.result);
          };
          file_reader.onerror = () => {
            reject(file);
          };
          file_reader.readAsText(file)
        })
      });

      const file_contents = await Promise.all(file_reader_promises)
      const new_models = importer.import_models(file_contents)
      
      let allModels = []
      new_models.forEach((modelData) => {
        allModels = allModels.concat(modelData.models)
      })
      
      this.imported_models = allModels;
      this.$nextTick(() => {
        this.importReady = true
      })
    },
    modelsParents: function(model) {
      return model.parents.map(parent => parent.name).join(", ");
    },
    clearMoveModel: function (e) {
      e.preventDefault()
      this.movingModel = undefined
    },
    moveModel: function(appid, modelid) {
      this.movingModel = {app: appid, model: modelid}
    },
    moveModelToApp: function(appid) {
      if (!this.movingModel) return
      const fromApp = this.movingModel.app;
      const model = this.movingModel.model;
      const toApp = appid;
      this.movingModel = undefined;
      if (fromApp === toApp) {
        console.error("Not Moving ", model, "to same app", toApp);
        return;
      }
      this.$store.dispatch("moveModelToApp", {
        fromApp: fromApp,
        toApp: toApp,
        model: model
      });
    },
    appData: function(appid) {
      return this.$store.getters.apps()[appid] ? this.$store.getters.apps()[appid].data() : undefined;
    },
    modelData: function(modelid) {
      return this.$store.getters.modelData(modelid);
    },
    relationshipData: function(relationshipid) {
      return this.$store.getters.relationships()[relationshipid].data();
    },
    fieldData: function(fieldid) {
      return this.$store.getters.fields()[fieldid] ? this.$store.getters.fields()[fieldid].data() : {name: '?', type: '?'};
    },
    showEditAppDialog: function(appid) {
      const appData = this.$store.getters.appData(appid)
      showFormDialog(
        "Edit application",
        formdata => {
          console.debug("Edit app", JSON.parse(JSON.stringify(formdata)))
          this.$firestore
            .collection("apps")
            .doc(appid)
            .update(formdata).then(() => {
              // NOT REACTIVE
              appData.name = formdata.name
            });
        },
        schemas.app(),
        appData
      );
    },
    showEditModelDialog: function(app, modelid) {
      const modelData = this.$store.getters.modelData(modelid);
      showFormDialog(
        "Edit model",
        formdata => {
          console.debug("Edit model", JSON.parse(JSON.stringify(formdata)))
          this.$firestore
            .collection("models")
            .doc(modelid)
            .update(formdata);
        },
        this._modelSchemaForApp(),
        {
          name: modelData.name,
          parents: modelData.parents,
          abstract: modelData.abstract
        }
      );
    },
    showEditRelationshipDialog: function(relationshipid) {
      const relationshipData = this.$store.getters.relationships()[relationshipid].data();
      showFormDialog(
        "Edit Relationship",
        formdata => {
          console.debug("Edit relationship", formdata)
          this.$firestore
            .collection("relationships")
            .doc(relationshipid)
            .update(formdata);
        },
        this._relationshipSchemaForApp(),
        {
          name: relationshipData.name,
          to: relationshipData.to,
          type: relationshipData.type,
          args: relationshipData.args
        }
      );
    },
    showEditFieldDialog: function(fieldid) {
      const fieldData = this.$store.getters.fields()[fieldid].data();
      console.debug("Edit field 1", JSON.parse(JSON.stringify(fieldData)))
      showFormDialog(
        "Edit field",
        formdata => {
          console.debug("Edit field", JSON.parse(JSON.stringify(formdata)))
          this.$firestore
            .collection("fields")
            .doc(fieldid)
            .update(formdata);
        },
        schemas.field(),
        {
          name: fieldData.name,
          type: fieldData.type,
          args: fieldData.args
        }
      );
    },
    showDeleteAppDialog: function(appid) {
      showDeleteDialog(
        "Are you sure you wish to delete the app " + this.appData(appid).name,
        () => {
          this.deleteApp(appid);
        }
      );
    },
    showDeleteModelDialog: function(appid, modelid) {
      showDeleteDialog(
        "Are you sure you wish to delete the model " +
          this.modelData(modelid).name,
        () => {
          this.deleteModel(appid, modelid);
        }
      );
    },
    showDeleteFieldDialog: function(modelid, fieldid) {
      showDeleteDialog(
        "Are you sure you wish to delete the field " +
          this.fieldData(fieldid).name,
        () => {
          this.deleteField(modelid, fieldid);
        }
      );
    },
    showDeleteRelationshipDialog: function(modelid, relationshipid) {
      showDeleteDialog(
        "Are you sure you wish to delete the relationship " +
          this.relationshipData(relationshipid).name,
        () => {
          this.deleteRelationship(modelid, relationshipid);
        }
      );
    },
    _modelSchemaForApp: function() {
      var schema_with_users_models = schemas.model();
      const data = this.$store.getters.projectData(this.id).data();
      const otherModelOptions = {}
      Object.keys(data.apps).forEach(appId => {
        const app = this.appData(appId)
        Object.keys(app.models).forEach(modelid => {
          const modelData = this.modelData(modelid);
          const rel = app.name + ".models." + modelData.name;
          otherModelOptions[rel] = { name: rel };
        });
      });
      
      const builtInOptions = Object.values(schema_with_users_models[1].options).reduce((acc, opt) => {
        acc[opt.name] = {name: opt.name}
        return acc
      }, {})

      const allOptions = Object.assign({}, otherModelOptions, builtInOptions)

      // Convert to select values to be read by SelectListObjects
      schema_with_users_models[1].options = Object.keys(allOptions).map((k) => ({ text: k, value: allOptions[k] }))
      return schema_with_users_models;
    },
    _relationshipSchemaForApp: function() {
      var schema_with_users_models = schemas.relationship();
      const data = this.$store.getters.projectData(this.id).data();
      Object.keys(data.apps).map(app => {
        const appData = this.appData(app);
        Object.keys(appData.models).map(modelid => {
          const modelData = this.modelData(modelid);
          const rel = appData.name + "." + modelData.name;
          schema_with_users_models[1].options[rel] = {};
        });
      });
      return schema_with_users_models;
    },
    showModelDialog: function (app) {
      this.$refs.inputUpload[0].value = null
      const extra = {
        name: "Upload",
        callback: () => {
          this.importingForApp = app;
          this.$refs.inputUpload[0].click()
        }
      }

      showFormDialog(
        "Add new model",
        formdata => {
          console.debug("Add new model", JSON.parse(JSON.stringify(formdata)))
          this.addModel(
            app,
            formdata.name,
            formdata.parents.map(parent => ({name: parent.name})),
            formdata.abstract
          );
        },
        this._modelSchemaForApp(),
        undefined,
        extra
      );
    },
    showRelationshipDialog: function(model) {
      showFormDialog(
        "Add new relationship",
        formdata => {
          console.debug("Add new relationship", JSON.parse(JSON.stringify(formdata)))
          this.addRelationship(
            model,
            formdata.name,
            formdata.to,
            formdata.type,
            formdata.args
          );
        },
        this._relationshipSchemaForApp()
      );
    },
    showFieldDialog: function(model) {
      showFormDialog(
        "Add new field",
        formdata => {
          console.debug("Add new field", JSON.parse(JSON.stringify(formdata)))
          this.addField(model, formdata.name, formdata.type, formdata.args);
        },
        schemas.field()
      );
    },
    addModel: function(
      app,
      name,
      parents,
      abstract,
      add_default_fields = true
    ) {
      return this.$store.dispatch("addModel", {
        app: app,
        name: name,
        parents: parents,
        abstract: abstract,
        add_default_fields: add_default_fields
      });
    },
    addField: function(model, name, type, args) {
      return this.$store.dispatch("addField", {
        model: model,
        name: name,
        type: type,
        args: args
      });
    },
    addRelationship: function(model, name, to, type, args) {
      this.$store.dispatch("addRelationship", {
        model: model,
        name: name,
        to: to,
        type: type,
        args: args
      });
    },
    deleteProject: function(pid) {
      this.$firestore
        .collection("projects")
        .doc(pid)
        .delete();
    },
    deleteApp: function(appid) {
      this.$gtag.event("delete-app", {
        event_category: "app",
        event_label: appid,
        value: 1
      });
      this.$firestore
        .collection("projects")
        .doc(this.id)
        .update({ [`apps.${appid}`]: firebase.firestore.FieldValue.delete() });
    },
    deleteModel: function(appid, modelid) {
      this.$gtag.event("delete-model", {
        event_category: "model",
        event_label: modelid,
        value: 1
      });
      this.$firestore
        .collection("apps")
        .doc(appid)
        .update({
          [`models.${modelid}`]: firebase.firestore.FieldValue.delete()
        });
    },
    deleteRelationship: function(modelid, relationshipid) {
      this.$gtag.event("delete-relationship", {
        event_category: "relationship",
        event_label: relationshipid,
        value: 1
      });
      this.$firestore
        .collection("models")
        .doc(modelid)
        .update({
          [`relationships.${relationshipid}`]: firebase.firestore.FieldValue.delete()
        });
    },
    deleteField: function(modelid, fieldid) {
      this.$gtag.event("delete-field", {
        event_category: "field",
        event_label: fieldid,
        value: 1
      });
      this.$firestore
        .collection("models")
        .doc(modelid)
        .update({
          [`fields.${fieldid}`]: firebase.firestore.FieldValue.delete()
        });
    }
  }
};
</script>

<style scoped>
.v-list-item__content {
  
}
</style>
