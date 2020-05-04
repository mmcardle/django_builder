<template>
  <v-col cols="12" md="4" order-sm="1" order-md="2">
    <h2 class="red--text text--darken-4 mx-3">
      <v-icon class="red--text text--darken-4">mdi-database</v-icon>Project Models
    </h2>
    <v-card class="ma-2 mb-5 mr-5" v-if="Object.keys(this.apps).length == 0">
      <v-card-text class="mb-5">
        <em>Add some apps so you can create models.</em>
      </v-card-text>
    </v-card>
    <div v-for="(app, appid) in this.apps" class="overflow-hidden" :key="appid">
      <v-card class="ma-2 mb-5">
        <v-card-title class="py-0">
          <a
            class="orange--text text--darken-1"
            @click="showEditAppDialog(appid)"
          >{{appData(appid).name}}</a>
        </v-card-title>
        <v-card-text class="mb-5">
          <drop
            v-if="Object.keys(draggingModel).length !== 0 && draggingModel.app !== appid"
            @drop="(modelid) => {dropModeltoApp(appid, modelid)}"
          >
            <v-alert class="text-center drag-model-location" :value="true" color="primary">
              Drop model here to move model to {{appData(appid).name}}
              <div class="mt-3">
                <v-icon x-large>mdi-chevron-down</v-icon>
              </div>
            </v-alert>
          </drop>

          <v-card
            v-for="model in $store.getters.ordered_models(appid)"
            :key="model.id + appid"
            class="mb-5 pt-1 pb-4"
            elevation="0"
          >
            <drag
              :transfer-data="{app: appid, model: model.id}"
              @drag="dragModel({app: appid, model: model.id})"
              @dragend="dragModelEnd({app: appid, model: model.id})"
            >
              <v-speed-dial
                absolute
                right
                direction="left"
                open-on-hover
                transition="slide-x-reverse-transition"
              >
                <template v-slot:activator>
                  <v-btn x-small color="info" right dark fab>
                    <v-icon>mdi-cogs</v-icon>
                  </v-btn>
                </template>

                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      x-small
                      fab
                      dark
                      color="green"
                      @click="showFieldDialog(model.id)"
                      v-on="on"
                    >
                      <v-icon>add</v-icon>
                    </v-btn>
                  </template>
                  <span>Add Field</span>
                </v-tooltip>

                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      x-small
                      fab
                      dark
                      color="warning"
                      @click="showRelationshipDialog(model.id)"
                      v-on="on"
                    >
                      <v-icon>share</v-icon>
                    </v-btn>
                  </template>
                  <span>Add Relationship</span>
                </v-tooltip>

                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      x-small
                      fab
                      dark
                      color="error"
                      @click="showDeleteModelDialog(appid, model.id)"
                      v-on="on"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <span>Delete Model</span>
                </v-tooltip>
              </v-speed-dial>

              <v-card-title class="py-0">
                <v-icon class="red--text text--darken-4 mr-1">mdi-database</v-icon>
                <a class="hljs-function" @click="showEditModelDialog(appid, model.id)">
                  {{modelData(model.id).name}}
                  <span
                    class="hljs-params"
                    v-if="modelData(model.id).parents && modelData(model.id).parents.length > 0"
                  >({{modelsParents(model.id)}})</span>
                  <span v-else></span>
                  <v-chip small v-if="modelData(model.id).abstract">Abstract</v-chip>
                </a>
                <!--v-icon>mdi-drag</v-icon-->
              </v-card-title>

              <v-list dense v-if="Object.keys(modelData(model.id).relationships).length > 0">
                <v-list-item
                  @click="showEditRelationshipDialog(relationshipid)" class="mb-1"
                  v-for="(relationship, relationshipid) in modelData(model.id).relationships"
                  ripple :key="relationshipid + appid"
                >
                  <v-list-item-avatar size="20" style="min-width: 30px">
                    <v-icon>device_hub</v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content>
                    <v-list-item-title class="subheading font-weight-medium">
                      <span class="red--text">{{relationshipData(relationshipid).name}}</span>
                    </v-list-item-title>
                    <v-list-item-subtitle class="body-2">
                      {{relationshipData(relationshipid).type.split('.').pop()}}
                      (<span class="green--text">{{relationshipData(relationshipid).to.split('.').pop()}}</span>,{{relationshipData(relationshipid).args}})
                    </v-list-item-subtitle>
                  </v-list-item-content>

                  <v-list-item-action>
                    <v-btn icon ripple @click.stop="showDeleteRelationshipDialog(model.id, relationshipid)"
                    >
                      <v-icon class="red--text text--darken-4">mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>

              <v-list two-line dense v-if="Object.keys(modelData(model.id).fields).length > 0">
                <v-list-item
                  @click="showEditFieldDialog(fieldid)" ripple
                  v-for="(field, fieldid) in modelData(model.id).fields"
                  :key="fieldid + appid"
                >
                  <v-list-item-avatar size="20" style="min-width: 30px" class="hidden-xs-only">
                    <v-icon small class="grey--text text--lighten-1">mdi-circle</v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content class="subheading font-weight-medium">
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
                      <v-icon small class="red--text">mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>

              <v-card-text
                v-if="Object.keys(modelData(model.id).fields).length + Object.keys(modelData(model.id).relationships).length == 0"
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
            </drag>
          </v-card>

          <div v-if="Object.keys(appData(appid).models).length === 0" class="mb-3">
            <v-subheader class="ma-2">Add some models.</v-subheader>
            <v-subheader class="ma-2">
              <v-btn color="info" block @click="showModelDialog(appid)">
                <v-icon>add</v-icon>Add model
              </v-btn>
            </v-subheader>
          </div>
        </v-card-text>
        <v-btn
          fab
          x-small
          absolute
          bottom
          right
          color="info"
          dark
          @click="showModelDialog(appid)"
          class="mb-2"
        >
          <v-icon>add</v-icon>
        </v-btn>
        <v-btn
          fab
          x-small
          absolute
          bottom
          left
          color="error"
          @click="showDeleteAppDialog(appid)"
          class="mb-2"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-card>
    </div>
  </v-col>
</template>

<script>
import firebase from "firebase/app";
import { schemas } from "@/schemas/";
import { showDeleteDialog, showFormDialog } from "@/dialogs/";
import "highlight.js/styles/a11y-light.css";

export default {
  props: ["id"],
  data: () => {
    return {
      draggingModel: {}
    };
  },
  computed: {
    apps: function() {
      if (this.$store.getters.projectData(this.id) === undefined) return [];
      return this.$store.getters.projectData(this.id).apps;
    }
  },
  methods: {
    modelsParents: function(model) {
      return this.modelData(model)
        .parents.map(parent => {
          if (parent.type == "user") {
            const model = this.$store.getters.modelData(parent.model);
            return model.name;
          } else if (parent.type == "django") {
            return parent.class.split(".").pop();
          }
        })
        .join(" ");
    },
    dragModel: function(model, _transferData, _nativeEvent) {
      this.draggingModel = model;
    },
    dragModelEnd: function(_model, _transferData, _nativeEvent) {
      this.draggingModel = {};
    },
    dropModeltoApp: function(toApp, modelData) {
      this.draggingModel = {};
      const fromApp = modelData.app;
      const model = modelData.model;
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
      return this.$store.getters.apps()[appid].data();
    },
    modelData: function(modelid) {
      return this.$store.getters.modelData(modelid);
    },
    relationshipData: function(relationshipid) {
      return this.$store.getters.relationships()[relationshipid].data();
    },
    fieldData: function(fieldid) {
      return this.$store.getters.fields()[fieldid].data();
    },
    showEditAppDialog: function(appid) {
      showFormDialog(
        "Edit application",
        formdata => {
          this.$firestore
            .collection("apps")
            .doc(appid)
            .update(formdata);
        },
        schemas.app,
        { name: this.$store.getters.apps()[appid].data().name }
      );
    },
    showEditModelDialog: function(app, modelid) {
      const modelData = this.$store.getters.modelData(modelid);
      showFormDialog(
        "Edit model",
        formdata => {
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
      const relationshipData = this.$store.getters
        .relationships()
        [relationshipid].data();
      showFormDialog(
        "Edit Relationship",
        formdata => {
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
      showFormDialog(
        "Edit field",
        formdata => {
          this.$firestore
            .collection("fields")
            .doc(fieldid)
            .update(formdata);
        },
        schemas.field,
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
      var schema_with_users_models = schemas.model.slice(0);
      const data = this.$store.getters.projectData(this.id);
      Object.keys(data.apps).map(app => {
        const appData = this.appData(app);
        Object.keys(appData.models).map(modelid => {
          const modelData = this.modelData(modelid);
          const rel = appData.name + ".models." + modelData.name;
          schema_with_users_models[1].options[rel] = {
            type: "user",
            model: modelid,
            app: app
          };
        });
      });
      return schema_with_users_models;
    },
    _relationshipSchemaForApp: function() {
      var schema_with_users_models = schemas.relationship.slice(0);
      const data = this.$store.getters.projectData(this.id);
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
    showModelDialog: function(app) {
      showFormDialog(
        "Add new model",
        formdata => {
          this.addModel(
            app,
            formdata.name,
            formdata.parents,
            formdata.abstract
          );
        },
        this._modelSchemaForApp()
      );
    },
    showRelationshipDialog: function(model) {
      showFormDialog(
        "Add new relationship",
        formdata => {
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
          this.addField(model, formdata.name, formdata.type, formdata.args);
        },
        schemas.field
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
      this.$ga.event({
        eventCategory: "app",
        eventAction: "delete-app",
        eventLabel: appid,
        eventValue: 1
      });
      this.$firestore
        .collection("projects")
        .doc(this.id)
        .update({ [`apps.${appid}`]: firebase.firestore.FieldValue.delete() });
    },
    deleteModel: function(appid, modelid) {
      this.$ga.event({
        eventCategory: "model",
        eventAction: "delete-model",
        eventLabel: modelid,
        eventValue: 1
      });
      this.$firestore
        .collection("apps")
        .doc(appid)
        .update({
          [`models.${modelid}`]: firebase.firestore.FieldValue.delete()
        });
    },
    deleteRelationship: function(modelid, relationshipid) {
      this.$ga.event({
        eventCategory: "relationship",
        eventAction: "delete-relationship",
        eventLabel: relationshipid,
        eventValue: 1
      });
      this.$firestore
        .collection("models")
        .doc(modelid)
        .update({
          [`relationships.${relationshipid}`]: firebase.firestore.FieldValue.delete()
        });
    },
    deleteField: function(modelid, fieldid) {
      this.$ga.event({
        eventCategory: "field",
        eventAction: "delete-field",
        eventLabel: fieldid,
        eventValue: 1
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
<style>
.drag-model-location {
  border-radius: 10px;
  position: absolute;
  z-index: 9999;
  width: 80%;
  top: 40px;
  left: 0;
  right: 0;
  opacity: 0.8;
}
</style>