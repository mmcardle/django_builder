<template>
<div style="display: contents;" class="order-sm-1 order-md-2">
  <v-col order=2 cols=12 class="text-center ma-0 pa-3 hidden-md-and-up">
    <div class="float-md-right">
      <a class="body-2" @click="full_screen_code_dialog" v-if="active">
        <v-icon small class="blue--text text--darken-4 mr-2">mdi-eye</v-icon>View {{active.name}} full screen.
      </a>
    </div>
  </v-col>
  <v-col order=2 class="py-0" >
    <v-row no-gutters>
      <v-col cols=6 md=4 lg=3 class="pr-0">
        <h2 class="mx-2">
          <span class="grey--text text--lighten-1 font-weight-black">
            <v-icon class="red--text text--darken-4 mr-2" large>mdi-file-tree</v-icon>
            <span class="red--text text--darken-2 text-capitalize">
              <span class="hidden-sm-and-down">Project</span> Files</span>
          </span>
        </h2>
        <v-card class="ma-2 mr-0" elevation="2">
          <v-card-text class="ma-0 pa-0">
            <v-treeview dense :items="items" :open.sync="open" :open-all="false" item-key="path" open-on-click return-object
              style="min-height: 800px;">
              <template v-slot:prepend="{ item, open }" v-on:click="click">
                <v-icon class="blue--text text--darken-4" v-if="item.folder && open" small>mdi-folder-open</v-icon>
                <v-icon class="blue--text text--darken-4" v-else-if="item.folder" small>mdi-folder</v-icon>
                <v-icon class="blue--text text--darken-4" v-else small>{{icon(item.name)}}</v-icon>
              </template>
              <template slot="label" slot-scope="{ item }">
                <div @click="click(item)" :class="active !== undefined && active.path === item.path ? 'red--text text--darken-4 font-weight-bold hidden-md-and-up' : 'hidden-md-and-up'">
                  {{ item.name }}
                </div>
                <div @click="click(item, true)" :class="active !== undefined && active.path === item.path ? 'red--text text--darken-4 font-weight-bold hidden-sm-and-down' : 'hidden-sm-and-down'">
                  {{ item.name }}
                </div>
              </template>
            </v-treeview>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols=6 md=8 lg=9 class="pl-1">
        <!--div>active_nodes:{{active_nodes}}</div>
        <div>active:{{active}}</div-->
        <template v-if="active">
          <h2 class="blue--text text--darken-4 mx-2">
            <v-icon class="blue--text text--darken-4 mr-2">{{icon(active.name)}}</v-icon>
            <span v-for="(part, i) in active_split" v-bind:key="i">
              <span hidden-sm-and-down class="blue-grey--text text--lighten-4 hidden-sm-and-down" v-if="i !== 0" > / </span>
              <span :class="i === active_split.length - 1 ? ['orange--text' , 'text--darken-1'] : ['blue--text', 'text--darken-1', 'hidden-sm-and-down']">
              {{ part }}
              </span>
            </span>
            <div class="float-md-right hidden-sm-and-down">
              <a class="body-2" @click="full_screen_code_dialog">
                <v-icon small class="blue--text text--darken-4 mr-2">mdi-eye</v-icon>Full screen
              </a>
            </div>
          </h2>
          <v-card class="ma-2" elevation="2">
            <v-card-text class="ma-0 pt-1">
              <!-- Important this the next line is all one line! -->
              <highlight-code :lang="lang(active.name)" style="min-height: 783px; max-height:800px; overflow-y:auto">{{active.render()}}</highlight-code>
            </v-card-text>
          </v-card>

          <v-dialog v-model="code_dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
            <v-card>
              <v-toolbar dark color="primary">
                <v-toolbar-title>
                  <h2 class="blue--text text--darken-4 mx-2">
                    <v-icon class="white--text text--darken-4 mr-2">{{icon(active.name)}}</v-icon>
                    <span v-for="(part, i) in active_split" v-bind:key="i">
                      <span class="blue-grey--text text--lighten-4 hidden-sm-and-down" v-if="i !== 0" > / </span>
                      <span :class="i === active_split.length - 1 ? ['white--text'] : ['white--text', 'hidden-sm-and-down']">
                      {{ part }}
                      </span>
                    </span>
                  </h2>
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                  <v-btn dark text @click="code_dialog = false">Close</v-btn>
                </v-toolbar-items>
              </v-toolbar>

              <div class="pa-1">
                <highlight-code :lang="lang(active.name)" style="min-height: 800px; max-height:800px; overflow-y:auto">{{active.render()}}</highlight-code>
              </div>

            </v-card>
          </v-dialog>
        </template>
      </v-col>
    </v-row>
  </v-col>
</div>
</template>

<script>

import Renderer from '@/django/rendering'

const renderer = new Renderer()

  export default {
    props: ['id'],
    data: () => ({
      overlay: false,
      active_nodes: [],
      active: undefined,
      open: [],
      code_dialog: undefined,
    }),
    computed: {
      sourcecode: () => "from django.db import models",
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
      active_split: function () {
        return this.active.path.split('/')
      },
      items: function () {
        return renderer.project_tree(this.id)
      }
    },
    mounted: function () {
      const project = this.$store.getters.projectData(this.id)
      const apps = Object.keys(project.apps).map((app) => {
        if (this.$store.getters.appData(app)) {
          return Object.assign(this.$store.getters.appData(app), {id: app})
        } else {
          return {}
        }
      })
      if (apps.length > 0 && this.$store.getters.appData(apps[0].id) !== undefined ) {
        const app = apps[0]
        const a = {
          path: app.name + "/models.py",
          name: "models.py",
          render: () => renderer.app_render("models.py", app.id)
        }
        this.active = a
        this.active_nodes = [a]
      } else {
        const a = {
          path: project.name + "/settings.py",
          name: "settings.py",
          render: () => renderer.project_render("settings.py", this.id)
        }
        this.active = a
        this.active_nodes = [a]
      }
    },
    created: function () {
      const project = this.$store.getters.projectData(this.id)
      const apps = Object.keys(project.apps).map((app) => {
        if (this.$store.getters.appData(app)) {
          return Object.assign(this.$store.getters.appData(app), {id: app})
        } else {
          return {}
        }
      })
      if (apps.length > 0 && this.$store.getters.appData(apps[0].id) !== undefined ) {
        const app = apps[0]
        this.open = [project.name, app.name]
      } else {
        this.open = [project.name]
      }
    },
    methods: {
      full_screen_code_dialog() {
        this.code_dialog = true
      },
      click(item) {
        if (item.render) {
          this.active = item
        }
      },
      icon: function (filename) {
        if (filename.endsWith(".py")) {
          return "mdi-language-python"
        } else if (filename.endsWith(".html")) {
          return "mdi-language-html5"
        } else {
          return "mdi-file"
        }
      },
      lang: function (filename) {
        if (filename.endsWith(".py")) {
          return 'python'
        } else if (filename.endsWith(".html")) {
          return 'django'
        } 
      },
    },
  }
</script>