<script setup lang="ts">
import { useRoute } from "vue-router";
import ProjectBody from "../components/ProjectBody.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "../stores/user";
import MainHeader from "../components/MainHeader.vue";

defineProps<{
  id: string;
}>();

const userStore = useUserStore();
const route = useRoute();
const { getCoreProject } = storeToRefs(userStore);
const projectId = route.params.id as string;
</script>

<template>
  <main id="content">
    <MainHeader />
    <div id="project">
      <ProjectBody v-bind:project="getCoreProject(projectId)" />
    </div>
  </main>
</template>

<style scoped>
#content {
  display: grid;
  height: 100vh;
  grid-template-rows: 50px calc(100% - 50px);
}
#project {
  margin: 4px;
}
</style>
