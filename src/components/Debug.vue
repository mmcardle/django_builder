<template>
  <div class="debug">
    <h1>{{ msg }}</h1>
    <v-text-field box v-model="new_name" placeholder="Enter a Name" />
    <p v-if="error">
      <v-alert color="error">
      {{error}}
      </v-alert>
    </p>
    <v-btn v-on:click="create_project">Create New Project</v-btn>
    <div v-for="project in projects" class="project pa-2" :key="project.id">
      <h1>Project {{project.data().name}} {{project.id}}</h1>
      <div>
        <v-btn v-on:click="delete_project(project.id)" color="error">Delete Project</v-btn>
        <p>Project Data: {{project.data()}}</p>

        <div v-for="(appdata, appid) in project.data().apps" class="app pa-2 pl-3" :key="project.id + appid">

          <template v-if="appsdata(appid)">
            <p v-if="appsdata(appid)">
              APP: {{appid}} - {{appdata}} - {{appsdata(appid).data()}}
            </p>

            <div v-for="(modeldata, modelid) in appsdata(appid).data().models" class="model pa-2 pl-3" :key="project.id + modelid">

              <template v-if="modelsdata(modelid)">
                <p>
                  MODEL: {{modelid}} - {{modeldata}} - {{modelsdata(modelid).data()}}
                </p>
                <p v-for="(fielddata, fieldid) in modelsdata(modelid).data().fields" class="field pa-2 pl-3" :key="project.id + fieldid">
                  Field: {{fieldid}} - {{fielddata}} - {{fieldsdata(fieldid).data()}}
                </p>
                <div>
                  <v-btn v-on:click.prevent="create_field(modelid)">Create Field</v-btn>
                </div>
              </template>

            </div>
            <div>
              <v-btn v-on:click.prevent="create_model(appid)">Create Model</v-btn>
            </div>
          </template>
        </div>
      </div>
      <div>
        <v-btn v-on:click.prevent="create_app(project)">Create App</v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import firebase from 'firebase/app';

export default {
  name: 'debug',
  data () {
    return {
      msg: 'Welcome to Django Builder 2.0!',
      error: '',
      new_name: '',
      projects: {},
      apps: {},
      models: {},
      fields: {}
    }
  },
  computed: {
    userid: function () {
      return firebase.auth().currentUser.uid;
    }
  },
  created: function () {
    this.load()
  },
  methods: {
    appsdata: function (appid) {
      return this.apps[appid]
    },
    modelsdata: function (modelid) {
      return this.models[modelid]
    },
    fieldsdata: function (fieldid) {
      return this.fields[fieldid]
    },
    load: function () {

      this.new_name = ''
      const projectref = this.$firestore.collection('projects')
      const appsref = this.$firestore.collection('apps')
      const modelsref = this.$firestore.collection('models')
      const fieldsref = this.$firestore.collection('fields')

      fieldsref.where(
        "owner", "==", this.userid
      ).get().then((fields) => {
        console.log('Loaded Fields', fields)
        this.fields = fields.docs.reduce(function (fields, field) {
          fields[field.id] = field
          return fields
        }, {})
      })

      modelsref.where(
        "owner", "==", this.userid
      ).get().then((models) => {
        console.log('Loaded Models', models)
        this.models = models.docs.reduce(function (models, model) {
          models[model.id] = model
          return models
        }, {})
      })

      appsref.where(
        "owner", "==", this.userid
      ).get().then((apps) => {
        console.log('Loaded Apps', apps)
        this.apps = apps.docs.reduce(function (apps, app) {
          apps[app.id] = app
          return apps
        }, {})
      })

      projectref.where(
        "owner", "==", this.userid
      ).get().then((projects) => {
        console.log('Loaded Projects', projects)
        this.projects = projects.docs.reduce(function (projects, project) {
          projects[project.id] = project
          return projects
        }, {})
      })
      .catch((err) => {
        console.log('Error getting documents', err);
      })
    },
    delete_project: function(projectid) {
      this.$firestore.collection("projects").doc(projectid).delete().then(function() {
          console.log("Document successfully deleted!");
      }).then(this.load).catch(function(error) {
          console.error("Error removing document: ", error);
      });
    },
    setup_project: function (project) {
      this.$firestore.collection('apps').doc(project.id).set({
        apps: {}, owner:  this.userid,
      }).then(this.load)
    },
    create_project: function ()  {
      this.error == undefined
      const name = this.new_name
      if (name === '') {
        this.error = 'Enter a name'
        return
      }
      this.$firestore.collection('projects').add({
        name: name,
        owner:  this.userid,
        apps: {}
      }).then((_project) => {
        this.load()
      })

    },
    create_app: function(project) {
      this.error == undefined
      const name = this.new_name
      if (name === '') {
        this.error = 'Enter a name'
        return
      }

      this.$firestore.collection('apps').add({
        name: name,
        owner:  this.userid,
        models: {}
      }).then((app) => {
        this.$firestore.collection('projects').doc(project.id).update(
          {[`apps.${app.id}`]: true}
        ).then(this.load)
      })
    },
    create_model: function(appid) {
      console.log('Create model', appid)
      this.error == undefined
      const name = this.new_name
      if (name === '') {
        this.error = 'Enter a name'
        return
      }

      this.$firestore.collection('models').add({
        name: name,
        owner:  this.userid,
        fields: {}
      }).then((model) => {
        this.$firestore.collection('apps').doc(appid).update(
          {[`models.${model.id}`]: true}
        ).then(this.load)
      })
    },
    create_field: function(modelid) {
      console.log('Create field', modelid)
      this.error == undefined
      const name = this.new_name
      if (name === '') {
        this.error = 'Enter a name'
        return
      }

      this.$firestore.collection('fields').add({
        name: name,
        owner:  this.userid,
        type: 'CharField',
        args: 'max_length=100'
      }).then((model) => {
        this.$firestore.collection('models').doc(modelid).update(
          {[`fields.${model.id}`]: true}
        ).then(this.load)
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

p.error {
  color: #ed1b2a;
}

.project {
  border: 1px solid red;
}
.app {
  border: 1px solid blue;
}
.model {
  border: 1px solid green;
}
.field {
  border: 1px solid black;
}

</style>
