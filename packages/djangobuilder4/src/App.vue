<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import { useUserStore } from "./stores/user";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import CenteredFormLayout from "./layouts/CenteredFormLayout.vue";
import LoadingSpinner from "./widgets/LoadingSpinner.vue";

const userStore = useUserStore();
const loading = ref(true);
const router = useRouter();

onMounted(async () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    console.debug("User", user);
    if (user) {
      await userStore.loginUser(user);
    } else {
      userStore.logoutUser();
      router.push({ name: "login" });
    }
    loading.value = false;
  });
});
</script>

<template>
  <template v-if="loading">
    <CenteredFormLayout>
      <div id="djangobuilder">Django Builder</div>
      <div id="loading">Loading...</div>
      <LoadingSpinner />
    </CenteredFormLayout>
  </template>
  <RouterView v-else />
</template>

<style scoped>
#djangobuilder {
  text-align: center;
  margin-bottom: 10px;
}
#loading {
  text-align: center;
}
</style>
