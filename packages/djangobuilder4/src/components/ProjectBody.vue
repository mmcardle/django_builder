<script setup lang="ts">
import { useUserStore } from "../stores/user";
import { addApp } from "../firebase";
import { storeToRefs } from "pinia";
import ProjectTree from "./ProjectTree.vue";
import PopUp from "@/widgets/PopUp.vue";
import EditableTextPopUp from "@/widgets/EditableTextPopUp.vue";

import {
  DjangoApp,
  DjangoModel,
  Renderer,
  type DjangoProject,
} from "@djangobuilder/core";
import {
  DjangoProjectFileResource,
  type DjangoProjectFile,
} from "@djangobuilder/core/src/rendering";
import { ref } from "vue";

const props = defineProps<{
  project: DjangoProject;
}>();

const userStore = useUserStore();
const { getUser, getProjectId } = storeToRefs(userStore);

const renderer = new Renderer();

const code = ref("");
const language = ref("python");
const active = ref("");
const addingApp = ref(false);

function handleClick(djangoFile: DjangoProjectFile): void {
  console.debug("Clicked on", djangoFile);
  active.value = djangoFile.path;
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
    case DjangoProjectFileResource.PROJECT_FILE:
      code.value = renderer.renderProjectFile(djangoFile.name, props.project);
      break;
    case DjangoProjectFileResource.APP_FILE:
      code.value = renderer.renderAppFile(
        djangoFile.name,
        djangoFile.resource as DjangoApp
      );
      break;
    case DjangoProjectFileResource.MODEL_FILE:
      code.value = renderer.renderModelFile(
        djangoFile.name,
        djangoFile.resource as DjangoModel
      );
      break;
    default:
      code.value = "";
      break;
  }
}

function download() {
  const tarballURL = renderer.tarballURL(props.project);
  const link = document.createElement("a");
  link.download = props.project.name + ".tar";
  link.href = tarballURL;
  document.body.appendChild(link);
  link.click();
}

function addAppHandler() {
  addingApp.value = true;
}
function addAppWithName(name: string) {
  addingApp.value = false;
  const user = getUser.value;
  const projectid = getProjectId.value(props.project);
  if (user && projectid) {
    addApp(user, projectid, name);
  }
}
</script>

<template>
  <div id="project-body">
    <div id="top">
      {{ props.project.name }}
      <div>
        <span id="add-app">
          <button class="project-button" @click="addAppHandler">Add App</button>
          <PopUp v-if="addingApp">
            <EditableTextPopUp
              value="app_name"
              title="App Name"
              v-on:update="(name) => addAppWithName(name)"
              v-on:abort="
                () => {
                  addingApp = false;
                }
              "
            >
              {{ "app_name" }}
            </EditableTextPopUp>
          </PopUp>
        </span>
        <button class="project-button" @click="download">Download</button>
      </div>
      <button class="project-button">Delete</button>
    </div>
    <div id="main">
      <div id="side">
        <div id="side-fixed">
          <ProjectTree
            :spacing="0"
            :project="project"
            :tree="renderer.asTree(props.project)"
            :open="false"
            :active="active"
            v-on:click="handleClick"
          />
        </div>
      </div>
      <div id="codecontent">
        <!--div id="tabs">
          <div class="tab">settings.py</div>
          <div class="tab tabselected">models.py</div>
        </div-->
        <div id="code">
          <!--div v-for="app in props.project.apps" v-bind:key="app.name">
            <ProjectApp :app="app" />
          </div-->
          <highlightjs :language="language" :code="code" />
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
#codecontent {
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
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}
#side {
  border-top: 1px dotted lightgray;
  border-right: 1px dotted lightgray;
  padding: 5px;
  padding-top: 15px;
}
#side-fixed {
  position: sticky;
  top: 0;
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
#codecontent {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  border-top: 1px dotted lightgray;
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
