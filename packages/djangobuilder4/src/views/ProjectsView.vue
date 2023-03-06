<script setup lang="ts">
import { useUserStore } from "../stores/user";
import { storeToRefs } from "pinia";
import ProjectHeader from "../components/ProjectHeader.vue";
import LoadingSpinner from "../widgets/LoadingSpinner.vue";
import MainHeader from "../components/MainHeader.vue";

const userStore = useUserStore();
const { getLoaded, getCoreProjects } = storeToRefs(userStore);
</script>

<template>
  <main id="content">
    <MainHeader />
    <div id="projects" v-if="getLoaded">
      <div v-for="(project, id) in getCoreProjects" v-bind:key="id">
        <ProjectHeader :project="project" />
      </div>
    </div>
    <div v-else>
      Loading ...
      <LoadingSpinner />
    </div>
  </main>
</template>

<style scoped>
#content {
  display: grid;
  height: 100vh;
  grid-template-rows: 50px calc(100% - 50px);
}
#projects {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  align-items: stretch;
}
#projects * {
  min-width: 32vw;
}
.project-header-wrapper {
  min-height: 30vh;
}
</style>
