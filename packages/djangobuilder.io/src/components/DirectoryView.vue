<template>
<div style="display: contents;" class="order-sm-1 order-md-2">
  <v-col order=2 cols=12 class="text-center ma-0 pa-3 d-block d-md-none">
    <div class="float-md-right">
      <a class="text-body-2" @click="full_screen_code_dialog" v-if="active">
        <v-icon size="small" class="text-blue-darken-4 mr-2">mdi-eye</v-icon>View {{active.name}} full screen.
      </a>
    </div>
  </v-col>
  <v-col order=2 cols="12" md="8" class="py-0" >
    <v-row no-gutters>
      <v-col cols=6 md=4 lg=3 class="pr-0">
        <h2 class="mx-2">
          <span class="text-grey-lighten-1 font-weight-black">
            <v-icon class="text-red-darken-4 mr-2" size="large">mdi-file-tree</v-icon>
            <span class="text-red-darken-2 text-capitalize">
              <span class="d-none d-md-inline">Project</span> Files</span>
          </span>
        </h2>
        <v-card class="ma-2 mr-0" elevation="2">
          <v-card-text class="ma-0 pa-0">
            <v-treeview density="compact" :items="items" item-title="name" item-value="path"
              open-on-click activatable return-object @update:activated="onActivated"
              style="min-height: 800px;">
              <template v-slot:prepend="{ item, isOpen }">
                <v-icon class="text-blue-darken-4" v-if="item.folder && isOpen" size="small">mdi-folder-open</v-icon>
                <v-icon class="text-blue-darken-4" v-else-if="item.folder" size="small">mdi-folder</v-icon>
                <v-icon class="text-blue-darken-4" v-else size="small">{{icon(item.name)}}</v-icon>
              </template>
              <template v-slot:title="{ item }">
                <span :class="active !== undefined && active.path === item.path ? 'text-red-darken-4 font-weight-bold' : ''">
                  {{ item.name }}
                </span>
              </template>
            </v-treeview>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols=6 md=8 lg=9 class="pl-1">
        <template v-if="active">
          <h2 class="text-blue-darken-4 mx-2">
            <v-icon class="text-blue-darken-4 mr-2">{{icon(active.name)}}</v-icon>
            <span v-for="(part, i) in active_split" v-bind:key="i">
              <span class="text-blue-grey-lighten-4 d-none d-md-inline" v-if="i !== 0" > / </span>
              <span :class="i === active_split.length - 1 ? ['text-orange-darken-1'] : ['text-blue-darken-1', 'd-none d-md-inline']">
              {{ part }}
              </span>
            </span>
            <div class="float-md-right d-none d-md-block">
              <a class="text-body-2" @click="full_screen_code_dialog">
                <v-icon size="small" class="text-blue-darken-4 mr-2">mdi-eye</v-icon>Full screen
              </a>
            </div>
          </h2>
          <v-card class="ma-2" elevation="2">
            <v-card-text class="ma-0 pt-1">
              <highlightjs :language="lang(active.name)" :code="render(active)" style="min-height: 783px; max-height:800px; overflow-y:auto" />
            </v-card-text>
          </v-card>

          <v-dialog v-model="code_dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
            <v-card>
              <v-toolbar dark color="primary">
                <v-toolbar-title>
                  <h2 class="text-blue-darken-4 mx-2">
                    <v-icon class="text-white-darken-4 mr-2">{{icon(active.name)}}</v-icon>
                    <span v-for="(part, i) in active_split" v-bind:key="i">
                      <span class="text-blue-grey-lighten-4 d-none d-md-inline" v-if="i !== 0" > / </span>
                      <span :class="i === active_split.length - 1 ? ['text-white'] : ['text-white', 'd-none d-md-inline']">
                      {{ part }}
                      </span>
                    </span>
                  </h2>
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                  <v-btn dark variant="text" @click="code_dialog = false">Close</v-btn>
                </v-toolbar-items>
              </v-toolbar>

              <div class="pa-1">
                <highlightjs :language="lang(active.name)" :code="render(active)" style="min-height: 800px; max-height:800px; overflow-y:auto" />
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
import { useMainStore } from '@/store'
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
      mainStore() {
        return useMainStore()
      },
      isloaded: function () {
        return this.mainStore.loaded
      },
      name: function () {
        if (this.mainStore.projectData(this.id) === undefined) return ''
        return this.mainStore.projectData(this.id).data().name
      },
      apps: function () {
        if (this.mainStore.projectData(this.id) === undefined) return []
        return this.mainStore.projectData(this.id).data().apps
      },
      active_split: function () {
        return this.active.path.split('/')
      },
      items: function () {
        const project = this.mainStore.projectData(this.id).data()
        const djangoCoreProject = this.mainStore.toCoreProject(this.id, project)
        const projectTreeListing = coreRenderer.asTree(djangoCoreProject);
        return recurseTreeToItems(projectTreeListing)
      }
    },
    mounted: function () {
      const project = this.mainStore.projectData(this.id).data()
      const djangoCoreProject = this.mainStore.toCoreProject(this.id, project)
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
      const project = this.mainStore.projectData(this.id).data();
      const apps = Object.keys(project.apps).map((app) => {
        if (this.mainStore.appData(app)) {
          return Object.assign(this.mainStore.appData(app), {id: app})
        } else {
          return {}
        }
      })
      if (apps.length > 0 && this.mainStore.appData(apps[0].id) !== undefined ) {
        const app = apps[0]
        this.open = [project.name, app.name]
      } else {
        this.open = [project.name]
      }
    },
    methods: {
      render(active) {
        const project = this.mainStore.projectData(this.id).data()
        const djangoCoreProject = this.mainStore.toCoreProject(this.id, project)
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
      onActivated(activated) {
        // With return-object + activatable, this is an array of the activated
        // raw item objects. Show the file (leaf) that was clicked.
        const item = Array.isArray(activated) ? activated[0] : activated
        if (item && !item.folder) {
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