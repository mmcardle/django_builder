
<template>
  <v-container pl-2 py-0>
    <v-row v-if="isloaded">
      <v-col cols="4">
        <h2 class="mx-2">
          <span class="grey--text text--lighten-1 font-weight-black">
            <v-icon class="red--text text--darken-4 mr-2" large>mdi-file-tree</v-icon>
            <span class="red--text text--darken-2 text-capitalize">Project Files</span>
          </span>
        </h2>
        <v-card class="ma-2" elevation="2">
          <v-card-text class="ma-0 pa-0">
            <v-treeview dense :items="items" :open.sync="open" :open-all="false" item-key="path" open-on-click return-object
              style="min-height: 800px;">
              <template v-slot:prepend="{ item, open }" v-on:click="click">
                <v-icon class="blue--text text--darken-4" v-if="item.folder && open" small>mdi-folder-open</v-icon>
                <v-icon class="blue--text text--darken-4" v-else-if="item.folder" small>mdi-folder</v-icon>
                <v-icon class="blue--text text--darken-4" v-else small>{{icon(item.name)}}</v-icon>
              </template>
              <template slot="label" slot-scope="{ item }">
                <div @click="click(item)" :class="active !== undefined && active.path === item.path ? 'red--text text--darken-4 font-weight-bold' : ''">
                  {{ item.name }}
                </div>
              </template>
            </v-treeview>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="8">
        <!--div>active_nodes:{{active_nodes}}</div>
        <div>active:{{active}}</div-->
        <template v-if="active">
          <h2 class="blue--text text--darken-4 mx-2">
            <v-icon class="blue--text text--darken-4 mr-2">{{icon(active.name)}}</v-icon>
            <span v-for="(part, i) in active_split" v-bind:key="i">
              <span class="blue-grey--text text--lighten-4" v-if="i !== 0"> / </span>
              <span :class="i === active_split.length - 1 ? ['orange--text' , 'text--darken-1'] : ['blue--text', 'text--darken-1']">
              {{ part }}
              </span>
            </span>
          </h2>
          <v-card class="ma-2" elevation="2">
            <v-card-text class="ma-0 pt-1">
              <!-- Important this the next line is all one line! -->
              <highlight-code :lang="lang(active.name)" style="min-height: 800px; max-height:800px; overflow-y:auto">{{active.render()}}</highlight-code>
            </v-card-text>
          </v-card>
        </template>
      </v-col>
    </v-row>
  </v-container>
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
        return Object.assign(this.$store.getters.appData(app), {id: app})
      })
      if (apps.length > 0) {
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
        return Object.assign(this.$store.getters.appData(app), {id: app})
      })
      if (apps.length > 0) {
        const app = apps[0]
        this.open = [project.name, app.name]
      } else {
        this.open = [project.name]
      }
    },
    methods: {
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