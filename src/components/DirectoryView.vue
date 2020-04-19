
<template>
  <v-layout row wrap v-if="isloaded">
    <v-flex xs4>
      <h2 class="mx-2">
        <span class="grey--text text--lighten-1 font-weight-black">
          <span class="red--text text--darken-2 text-capitalize">
            <font-awesome-icon icon="file-alt" /> Project Files</span>
        </span>
      </h2>
      <v-card class="ma-2" elevation="2">
        <v-card-text class="ma-0 pt-0">
          <v-treeview :items="items" :open.sync="open" :open-all="false" item-key="path" open-on-click return-object>
          <template v-slot:prepend="{ item, open }" v-on:click="click">
            <font-awesome-icon class="blue--text text--darken-4" v-if="item.folder" :icon="open ? ['fa', 'folder-open'] : ['fa', 'folder']" />
            <font-awesome-icon class="blue--text text--darken-4" v-else :icon="icon(item.name)" />
          </template>
          <template slot="label" slot-scope="{ item }">
            <div @click="click(item)" :class="active !== undefined && active.path === item.path ? 'red--text text--darken-4 font-weight-bold' : ''">
              {{ item.name }}
            </div>
          </template>
        </v-treeview>
      </v-card-text>
      </v-card>
    </v-flex>
    <v-flex xs8>
      <!--div>active_nodes:{{active_nodes}}</div>
      <div>active:{{active}}</div-->
      <template v-if="active">
        <h2 class="blue--text text--darken-4 mx-2">
          <font-awesome-icon :icon="icon(active.name)" class="mr-2" />
          <span v-for="(part, i) in active_split" v-bind:key="i">
            <span class="blue-grey--text text--lighten-4" v-if="i !== 0"> / </span>
            <span :class="i === active_split.length - 1 ? ['orange--text' , 'text--darken-1'] : ['blue--text', 'text--darken-1']">
             {{ part }}
            </span>
          </span>
        </h2>
        <v-card class="ma-2" elevation="2">
          <v-card-text class="ma-0 pt-0">
            <highlight-code :lang="lang(active.name)" style="min-height: 800px; max-height:800px; overflow-y:auto">
              {{active.render()}}
            </highlight-code>
          </v-card-text>
        </v-card>
      </template>
    </v-flex>
  </v-layout>
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
          return ["fab", 'python'] 
        } else if (filename.endsWith(".html")) {
          return ["fab", "html5"] 
        } else {
          return ["fa", "file-alt"]
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