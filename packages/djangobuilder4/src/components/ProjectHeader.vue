<script setup lang="ts">
import { DjangoVersion, type DjangoProject } from "@djangobuilder/core";
import { useUserStore } from "../stores/user";
import { storeToRefs } from "pinia";
import { updateProject } from "@/api";
import EditableText from "@/widgets/EditableText.vue";
import EditableBoolean from "@/widgets/EditableBoolean.vue";
import EditableChoice from "@/widgets/EditableChoice.vue";
import ConfirmableButton from "@/widgets/ConfirmableButton.vue";

const props = defineProps<{
  project: DjangoProject;
}>();

const DjangoVersionChoices = {
  [`${DjangoVersion.DJANGO2}`]: DjangoVersion.DJANGO2.toString(),
  [`${DjangoVersion.DJANGO3}`]: DjangoVersion.DJANGO3.toString(),
  [`${DjangoVersion.DJANGO4}`]: DjangoVersion.DJANGO4.toString(),
};

const userStore = useUserStore();
const { getProjectId } = storeToRefs(userStore);
const projectid = getProjectId.value(props.project);

function handleDeleteProject() {
  userStore.deleteProject(props.project);
}
</script>

<template>
  <div class="project-header">
    <router-link :to="{ name: 'project', params: { id: projectid } }">{{
      project.name
    }}</router-link>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td>Description</td>
        <td>
          <EditableText
            :value="props.project.description"
            v-on:update="
            (description: string) => updateProject(props.project, { description })
          "
          >
            {{ props.project.description }}
          </EditableText>
        </td>
      </tr>
      <tr>
        <td>django version</td>
        <td>
          <EditableChoice
            :value="String(project.version)"
            :choices="DjangoVersionChoices"
            display_as="radio"
            v-on:update="(django_version: string) => updateProject(props.project, { django_version })"
          />
        </td>
      </tr>
      <tr>
        <td>htmx</td>
        <td>
          <EditableBoolean
            :value="props.project.htmx"
            v-on:update="(htmx) => updateProject(props.project, { htmx })"
          />
        </td>
      </tr>
      <tr>
        <td>channels</td>
        <td>
          <EditableBoolean
            :value="props.project.channels"
            v-on:update="
              (channels) => updateProject(props.project, { channels })
            "
          />
        </td>
      </tr>
      <!--tr>
        <td>Apps</td>
        <td>
          <div v-for="app in project.apps" :key="app.name">
            {{ app.name }}
            <ConfirmableButton
              :message="`Are you sure you wish to delete the app '${app.name}'?`"
              @confirm="handleDeleteApp(app)"
            />
          </div>
        </td>
      </tr-->
    </table>
    <div class="delete-project-button">
      <ConfirmableButton
        :message="`Are you sure you wish to delete Project '${props.project.name}'?`"
        :text="'&#128465;'"
        @confirm="handleDeleteProject()"
      />
    </div>
  </div>
</template>

<style scoped>
a {
  display: inline-block;
  margin: 10px 0px;
}
.description {
  overflow-y: hidden;
  margin-bottom: 4px;
}
.project-header {
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}
table {
  table-layout: fixed;
}
td {
  width: 50%;
  vertical-align: top;
}
.app {
  padding-right: 5px;
}
.delete-app-button {
  margin: 0;
  padding: 0 4px;
  color: red;
}

.delete-project-button {
  margin: 0;
  position: absolute;
  bottom: 20px;
  right: 0;
  margin: 4px;
}
</style>
