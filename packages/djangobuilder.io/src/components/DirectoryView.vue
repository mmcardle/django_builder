<template>
<div style="display: contents;" class="order-sm-1 order-md-2">
  <v-col order=2 cols=12 class="text-center ma-0 pa-3 hidden-md-and-up">
    <div class="float-md-right">
      <a class="text-body-2" @click="full_screen_code_dialog" v-if="active">
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
            <v-treeview dense :items="items" v-model:open="open" :open-all="false" item-key="path" open-on-click return-object
              style="min-height: 800px;">
              <template v-slot:prepend="{ item, open }">
                <v-icon class="blue--text text--darken-4" v-if="item.folder && open" small>mdi-folder-open</v-icon>
                <v-icon class="blue--text text--darken-4" v-else-if="item.folder" small>mdi-folder</v-icon>
                <v-icon class="blue--text text--darken-4" v-else small>{{icon(item.name)}}</v-icon>
              </template>
              <template v-slot:label="{ item }" >
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
              <a class="text-body-2" @click="full_screen_code_dialog">
                <v-icon small class="blue--text text--darken-4 mr-2">mdi-eye</v-icon>Full screen
              </a>
            </div>
          </h2>
          <v-card class="ma-2" elevation="2">
            <v-card-text class="ma-0 pt-1">
              <!-- Important this the next line is all one line! -->
              <highlight-code :lang="lang(active.name)" style="min-height: 783px; max-height:800px; overflow-y:auto">{{render(active)}}</highlight-code>
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
                <highlight-code :lang="lang(active.name)" style="min-height: 800px; max-height:800px; overflow-y:auto">{{render(active)}}</highlight-code>
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
import { Renderer as DBCoreRenderer } from "@djangobuilder/core"
import { DjangoProjectFileResource } from "@djangobuilder/core/src/rendering"
const coreRenderer = new DBCoreRenderer();

const recurseTreeToItems = (tree) => {
  return tree.map((item) => {
    return {
      appName: item.appName,
      name: item.name,
      path: item.path,
      folder: item.folder,
      type: item.type,
      children: item.children ? recurseTreeToItems(item.children) : undefined
    }
  })
}

export default {
    props: ['id'],
    data: () => ({
      overlay: false,
      active: undefined,
      open: [],
      code_dialog: undefined,
    }),
    computed: {
      isloaded: function () {
        return this.$store.getters.loaded()
      },
      name: function () {
        if (this.$store.getters.projectData(this.id) === undefined) return ''
        return this.$store.getters.projectData(this.id).data().name
      },
      apps: function () {
        if (this.$store.getters.projectData(this.id) === undefined) return []
        return this.$store.getters.projectData(this.id).data().apps
      },
      active_split: function () {
        return this.active.path.split('/')
      },
      items: function () {
        const project = this.$store.getters.projectData(this.id).data()
        const djangoCoreProject = this.$store.getters.toCoreProject(this.id, project)
        const projectTreeListing = coreRenderer.asTree(djangoCoreProject);
        return recurseTreeToItems(projectTreeListing)
      }
    },
    mounted: function () {
      const project = this.$store.getters.projectData(this.id).data()
      const djangoCoreProject = this.$store.getters.toCoreProject(this.id, project)
      const tree = coreRenderer.asTree(djangoCoreProject);
      if (project.apps.length > 0) {
        const appNode = tree.find(node => node.name == project.apps[0].name)
        if (appNode) {
          const modelsNode = appNode.children.find(node => node.name === "models.py")
          this.active = modelsNode
          return
        }
      }
      const projectNode = tree.find(node => node.name == project.name)
      if (projectNode) {
        const settingsNode = projectNode.children.find(node => node.name === "settings.py")
        if (settingsNode) {
          this.active = settingsNode
        }
      }
    },
    created: function () {
      const project = this.$store.getters.projectData(this.id).data();
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
      render(active) {
        const project = this.$store.getters.projectData(this.id).data()
        const djangoCoreProject = this.$store.getters.toCoreProject(this.id, project)
        if (active.type == DjangoProjectFileResource.PROJECT_FILE) {
          return coreRenderer.renderProjectFile(active.name, djangoCoreProject)
        } else if (active.type == DjangoProjectFileResource.APP_FILE) {
          const djangoCoreApp = djangoCoreProject.apps.find((app) => app.name == active.appName)
          return coreRenderer.renderAppFile(active.name, djangoCoreApp)
        } else if (active.type == DjangoProjectFileResource.MODEL_FILE) {
          const djangoCoreApp = djangoCoreProject.apps.find((app) => app.name == active.appName)
          const djangoCoreModel = djangoCoreApp.models.find((model) => model.name == active.modelName)
          const modelFile = active.name.split("_").slice(1).join("_");
          return coreRenderer.renderModelFile(modelFile, djangoCoreModel)
        } else if (active.type == DjangoProjectFileResource.FOLDER) {
          // Nothing to render
        } else {
          throw new Error(`No renderer for ${active.type} ${active.path}`)
        }
      },
      full_screen_code_dialog() {
        this.code_dialog = true
      },
      click(item) {
        if (!item.folder) {
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