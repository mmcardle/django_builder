<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "../stores/user";
import { storeToRefs } from "pinia";
import ProjectTree from "./ProjectTree.vue";
import EditableTextPopUp from "@/widgets/EditableTextPopUp.vue";
import PopUp from "@/widgets/PopUp.vue";
import ConfirmableButton from "@/widgets/ConfirmableButton.vue";

import {
  DjangoApp,
  DjangoModel,
  DjangoProject,
  Renderer,
} from "@djangobuilder/core";
import {
  DjangoProjectFileResource,
  type DjangoProjectFile,
} from "@djangobuilder/core/src/rendering";
import router from "@/router";

const props = defineProps<{
  project: DjangoProject;
}>();

const route = useRoute();
const projectId = route.params.id as string;

const userStore = useUserStore();
const { getAppId, getCoreApp } = storeToRefs(userStore);

const renderer = new Renderer();

const project = ref<DjangoProject>(props.project);


const loaded = ref(false);
const code = ref("");
const language = ref("python");
const active = ref<DjangoProjectFile>();
const activeApp = ref();
const addingApp = ref(false);
const addingModel = ref(false);

const deletingProject = ref(false);
const deletingApp = ref(false);
const deletingModel = ref(false);

const modelToDelete = ref();
const modelChoices = ref<Array<DjangoModel>>([]);
const opened = ref();

watch(userStore, renderFile);

onMounted(() => {
  project.value = userStore.getCoreProject(projectId);
  const pathParams = route.params.path;

  // if not pathParam found find first app and show models.py
  const { djangoFile, appNode } = findByPath(project.value, pathParams)
  active.value = djangoFile
  opened.value = appNode

  if(!active.value) {
    const { djangoFile, appNode } = chooseFileToDisplay(project.value);
    active.value = djangoFile
    opened.value = appNode
  }

  loaded.value = true;
  renderFile();
});


function findByPath(project: DjangoProject, params: string | string[]) {
  const projectTree = renderer.asTree(project);
  const projectFiles = renderer.asFlat(project);
  let djangoFile;
  let appNode;
  const pathParam = params instanceof String ? params : (params as string[]).join("/");
    djangoFile = projectFiles.find((node) => node.path === pathParam);
    if (
      djangoFile &&
      djangoFile.type === DjangoProjectFileResource.APP_FILE
    ) {
      const app: DjangoApp = djangoFile.resource as DjangoApp;
      appNode = projectTree.find(
        (node) => node.name === app.name && node.folder === true
      );
    }
  
    return { djangoFile, appNode }
}

function chooseFileToDisplay(project: DjangoProject) {
  const projectTree = renderer.asTree(project);
  let djangoFile;
  let appNode;
  if (!active.value && project.apps.length > 0) {
    const firstApp = project.apps[0];
    appNode = projectTree.find(
      (node) => node.name === firstApp.name && node.folder === true
    );
    if (appNode && appNode.children) {
      djangoFile = appNode.children.find((node) => node.name === "models.py");
    }
  } else if (!djangoFile) {
    // if no apps, find settings.py file
    const projectNode = projectTree.find(
      (node) => node.name === project.name && node.folder === true
    );
    appNode = projectNode;
    if (projectNode && projectNode.children) {
      djangoFile = projectNode.children.find(
        (node) => node.name === "settings.py"
      );
    }
  }
  return { djangoFile, appNode }
}

function handleProjectFolderClick(djangoFile: DjangoProjectFile): void {
  console.debug("Folder Clicked on", djangoFile);
  if (djangoFile.resource instanceof DjangoApp) {
    console.debug("Current App", djangoFile.resource);
    activeApp.value = djangoFile.resource
  } else {
    activeApp.value = undefined;
  }
}

function handleProjectFileClick(djangoFile: DjangoProjectFile): void {
  console.debug("Clicked on", djangoFile);
  if (djangoFile.resource instanceof DjangoApp) {
    console.debug("Current App", djangoFile.resource);
    activeApp.value = djangoFile.resource
  }
  active.value = djangoFile;
  renderFile();
}

function renderFile(): void {
  console.debug("Render File", active.value);

  const djangoFile = active.value;
  if (!djangoFile) {
    return;
  }

  router.replace({
    path: `/project/${projectId}/${djangoFile.path}`,
  });

  const extension = djangoFile.name.split(".").pop();
  switch (extension) {
    case "py":
      language.value = "python";
      break;
    case "html":
      language.value = "html";
      break;
    case "ini":
      language.value = "ini";
      break;
  }

  switch (djangoFile.type) {
    case DjangoProjectFileResource.PROJECT_FILE: {
      code.value = renderer.renderProjectFile(djangoFile.name, project.value);
      break;
    }
    case DjangoProjectFileResource.APP_FILE: {
      const appid = getAppId.value(djangoFile.resource as DjangoApp);
      if (!appid) {
        console.error("No such app", djangoFile);
        break;
      }
      const updatedApp = getCoreApp.value(appid);
      modelChoices.value = updatedApp.models as DjangoModel[];
      code.value = renderer.renderAppFile(djangoFile.name, updatedApp);
      break;
    }
    case DjangoProjectFileResource.MODEL_FILE: {
      code.value = renderer.renderModelFile(
        djangoFile.name,
        djangoFile.resource as DjangoModel
      );
      break;
    }
    default:
      code.value = "";
      break;
  }
}

function handleDownload() {
  const tarballURL = renderer.tarballURL(project.value);
  const link = document.createElement("a");
  link.download = project.value.name + ".tar";
  link.href = tarballURL;
  document.body.appendChild(link);
  link.click();
}

function handleAddApp(name: string) {
  addingApp.value = false;
  userStore.addApp(project.value, name);
}

async function handleAddModel(app: DjangoApp | undefined, name: string) {
  addingModel.value = false;
  if (app) {
    // TODO - abstract
    userStore.addModel(app, name, false);
  }
}

async function handleDeleteProject() {
  deletingProject.value = true;
  await userStore.deleteProject(project.value);
  await router.push({name: "projects"})
}

async function handleDeleteApp() {
  deletingApp.value = true;
  const toDelete = activeApp.value;
  activeApp.value = undefined;
  await userStore.deleteApp(toDelete);
  project.value = userStore.getCoreProject(projectId);
  active.value = undefined
  const { djangoFile, appNode } = chooseFileToDisplay(project.value);
  active.value = djangoFile
  opened.value = appNode
  renderFile();
  deletingApp.value = false;
}

async function handleDeleteModel() {
  deletingModel.value = false;
  const toDelete = modelToDelete.value;
  toDelete.value = undefined;
  await userStore.deleteModel(toDelete);
}
</script>

<template>
  <div id="project-body" v-if="!deletingProject && !deletingApp">
    <div id="top">
      {{ props.project.name }}
      <div>
        <span id="add-app">
          <button class="project-button" @click="addingApp = true">
            Add App
          </button>
          <EditableTextPopUp
            v-if="addingApp"
            value="app_name"
            title="App Name"
            v-on:update="(name) => handleAddApp(name)"
            v-on:abort="addingApp = false"
          />
        </span>
        <button class="project-button" @click="handleDownload">Download</button>
        <span class="project-button">
          <ConfirmableButton
          :message="`Are you sure you wish to delete Project '${props.project.name}'?`"
          :text="'&#128465;'"
          @confirm="handleDeleteProject()"
          />
        </span>
      </div>
      <span><!--spacer --></span>
    </div>
    <div id="main">
      <div id="side">
        <div id="side-fixed">
          <ProjectTree
            v-if="loaded"
            :spacing="0"
            :project="project"
            :tree="renderer.asTree(props.project)"
            :open="false"
            :opened="opened"
            :active="active ? active.path : ''"
            v-on:click="handleProjectFileClick"
            v-on:folder-click="handleProjectFolderClick"
          />
        </div>
      </div>
      <div id="side-right">
        <div id="code-tools">
          <span v-if="active" id="code-tools-path">
            {{ active.path }}
          </span>
          <span
            id="code-tools-buttons"
            v-if="
              active?.resource &&
              active.type === DjangoProjectFileResource.APP_FILE
            "
          >
            <button
              id="code-tools-add-model-button"
              @click="addingModel = true"
            >
              Add Model
            </button>
            <EditableTextPopUp
              v-if="active && addingModel"
              value="Model1"
              title="Add Model"
              v-on:update="(name) => handleAddModel(active?.resource as DjangoApp, name)"
              v-on:abort="addingModel = false"
            />

            <button
              id="code-tools-add-model-button"
              :disabled="modelChoices.length == 0"
              @click="deletingModel = true"
            >
              Delete Model
            </button>
            <PopUp v-if="deletingModel">
              <div>Choose model to delete:</div>
              <select
                id="code-tools-delete-model-select"
                @keydown.escape="deletingModel = false"
                v-model="modelToDelete"
              >
                <option
                  v-for="model in modelChoices"
                  :value="model"
                  :key="model.name"
                >
                  {{ model.name }}
                </option>
              </select>
              <button
                id="code-tools-delete-model-button"
                :disabled="modelToDelete === undefined"
                @click="handleDeleteModel()"
              >
                OK
              </button>
              <button
                id="code-tools-cancel-delete-model-button"
                @click="deletingModel = false"
              >
                Cancel
              </button>
            </PopUp>
            <ConfirmableButton
              v-if="activeApp"
              :message="`Are you sure you wish to delete App '${activeApp.name}'?`"
              :text="`Delete App`"
              :style="'margin-left: 20px'"
              @confirm="handleDeleteApp()"
            />
          </span>
        </div>
        <div id="code-content">
          <div id="code">
            <highlightjs :language="language" :code="code" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.hljs {
  background: transparent;
}
pre code.hljs {
  padding: 0;
}
</style>

<style scoped>
#code pre {
  margin: 0;
}
#project-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px dotted lightgray;
  clear: both;
  overflow: auto;
  /*border: 1px solid red;*/
}
#project-body * {
  /*border: 1px solid red;*/
}
#top {
  padding: 0.4em 0em;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
#add-app {
  display: inline-block;
}
.project-button {
  margin: 0 4px;
}
#main {
  display: grid;
  grid-template-columns: 1fr 6fr;
}
#side {
  border-top: 1px dotted lightgray;
  border-right: 1px dotted lightgray;
}
#side-fixed {
  position: sticky;
  top: 0;
  padding: 5px;
  padding-top: 15px;
  white-space: nowrap;
}
#side-right {
}
#tabs {
  display: flex;
  flex-direction: row;
  padding-bottom: 4px;
  border-bottom: 1px solid lightgray;
}
.tab {
  padding: 0.1em 0;
  border-top: 1px solid transparent;
  border-left: 1px solid transparent;
  cursor: pointer;
  margin: 0px 4px;
}
.tab:hover,
#side .file:hover,
#side .folder:hover {
  background-color: rgb(245, 245, 245);
}
.tabselected {
  font-weight: 900;
}
.tab:last-child {
  border-right: 1px solid transparent;
}
#code-tools {
  background-color: white;
  border-top: 1px dotted lightgray;
  border-bottom: 1px dotted lightgray;
  padding: 5px;
  position: sticky;
  top: 0;
}
#code-tools-path {
}
#code-tools-buttons * {
  margin-left: 20px;
}
#code-tools button, #code-tools .button {
}
#code-tools-delete-model-select {
  display: block;
  width: 100%;
  margin: 4px 0;
}
#code-tools-delete-model-button {
  float: right;
  margin-top: 4px;
}
#code-tools-cancel-delete-model-button {
}
#code-content {
  padding: 5px;
}
#code {
  padding: 0;
  flex-grow: 1;
  border-left: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-right: 1px solid transparent;
}
</style>
