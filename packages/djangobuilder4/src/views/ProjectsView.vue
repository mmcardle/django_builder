<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "../stores/user";
import { storeToRefs } from "pinia";
import ProjectHeader from "../components/ProjectHeader.vue";
import LoadingSpinner from "../widgets/LoadingSpinner.vue";
import MainHeader from "../components/MainHeader.vue";
import EditableBoolean from "@/widgets/EditableBoolean.vue";
import EditableChoice from "@/widgets/EditableChoice.vue";
import { DjangoVersion } from "@djangobuilder/core";
import { createProject } from "@/firebase";

const userStore = useUserStore();
const { getLoaded, getCoreProjects } = storeToRefs(userStore);

const creatingProject = ref(false);

const nameDefault = "NewProject";

const name = ref(nameDefault);
const django_version = ref(DjangoVersion.DJANGO4.toString());
const description = ref("");
const htmx = ref(true);
const channels = ref(true);

const error = ref("");

const DjangoVersionChoices = {
  [`${DjangoVersion.DJANGO2}`]: DjangoVersion.DJANGO2.toString(),
  [`${DjangoVersion.DJANGO3}`]: DjangoVersion.DJANGO3.toString(),
  [`${DjangoVersion.DJANGO4}`]: DjangoVersion.DJANGO4.toString(),
};

async function handleCreateProject() {
  error.value = "";
  if (!name.value) {
    error.value = "Set a name";
    return;
  }
  await createProject(
    name.value,
    description.value,
    django_version.value,
    htmx.value,
    channels.value
  );
  creatingProject.value = false;
  name.value = nameDefault;
  description.value = "";
  htmx.value = true;
  channels.value = true;
  django_version.value = DjangoVersion.DJANGO4.toString();
}
</script>

<template>
  <main id="content">
    <MainHeader />
    <div id="projects" v-if="getLoaded">
      <div
        v-for="(project, id) in getCoreProjects"
        v-bind:key="id"
        class="project-header-wrapper"
      >
        <ProjectHeader :project="project" />
      </div>
      <div id="new-project">
        <button
          v-if="!creatingProject"
          id="new-project-button"
          @click="creatingProject = true"
        >
          New Project
        </button>
        <div v-else id="new-project-form">
          <span id="new-project-title">Create Project</span>
          <form @submit.prevent>
            <table cellpadding="2" cellspacing="2">
              <tr v-if="error">
                <td colspan="2">
                  <div id="new-project-error">
                    {{ error }}
                  </div>
                </td>
              </tr>
              <tr>
                <td>Name</td>
                <td>
                  <input name="name" v-model="name" autocomplete="off" />
                </td>
              </tr>
              <tr>
                <td>Description</td>
                <td>
                  <textarea name="description" v-model="description"></textarea>
                </td>
              </tr>
              <tr>
                <td>django version</td>
                <td>
                  <EditableChoice
                    :value="String(django_version)"
                    :choices="DjangoVersionChoices"
                    display_as="radio"
                    v-on:update="(value: string) => django_version = value"
                  />
                </td>
              </tr>
              <tr>
                <td>htmx</td>
                <td>
                  <EditableBoolean
                    :value="htmx"
                    v-on:update="(value: boolean) => (htmx = value)"
                  />
                </td>
              </tr>
              <tr>
                <td>channels</td>
                <td>
                  <EditableBoolean
                    :value="channels"
                    v-on:update="(value: boolean) => (channels = value)"
                  />
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <button
                    id="create-project-button"
                    @click="handleCreateProject"
                  >
                    Create
                  </button>
                  <button
                    id="cancel-project-button"
                    @click="creatingProject = false"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            </table>
          </form>
        </div>
      </div>
    </div>
    <div v-else>
      <div id="loading">
        <div>Loading ...</div>
        <LoadingSpinner />
      </div>
    </div>
  </main>
</template>

<style scoped>
#loading {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
#content {
  display: grid;
  height: 100vh;
  grid-template-rows: 50px calc(100% - 50px);
}
#projects {
  display: grid;
  grid-auto-rows: 1fr;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(3, 1fr);
}

/* Extra small devices (phones, 600px and down) */
@media only screen and (max-height: 600px) {
  #projects {
    grid-template-rows: repeat(1, 1fr);
  }
}

/* Small devices (portrait tablets and large phones, 600px and up) */
@media only screen and (min-height: 600px) {
  #projects {
    grid-template-rows: repeat(2, 1fr);
  }
}

/* Medium devices (landscape tablets, 768px and up) */
@media only screen and (min-height: 768px) {
  #projects {
    grid-template-rows: repeat(3, 1fr);
  }
}

/* Large devices (laptops/desktops, 992px and up) */
@media only screen and (min-height: 992px) {
  #projects {
    grid-template-rows: repeat(4, 1fr);
  }
}

/* Extra large devices (large laptops and desktops, 1200px and up) */
@media only screen and (min-height: 1200px) {
  #projects {
    grid-template-rows: repeat(5, 1fr);
  }
}

.project-header-wrapper {
  border: 1px dotted lightgray;
  margin: 10px;
}
#new-project {
  border: 1px dotted lightgray;
  margin: 10px;
  flex-direction: column;
  position: relative;
}
#new-project-title {
  text-decoration: underline;
  margin-bottom: 4px;
}
#new-project-form {
  margin: 10px 10px;
}
#new-project-form table {
  width: 100%;
}
#new-project-form table input,
#new-project-form table textarea {
  width: 100%;
}
#new-project-button {
  position: relative;
  top: calc(50% - 10px);
  width: 50%;
  left: 25%;
  padding: 5px;
}
#create-project-button {
  margin-top: 5px;
  float: right;
}
#cancel-project-button {
  margin-top: 5px;
  color: gray;
}
#new-project-error {
  color: red;
  text-align: center;
  border: 1px solid red;
  padding: 4px;
  border-radius: 4px;
}
</style>
