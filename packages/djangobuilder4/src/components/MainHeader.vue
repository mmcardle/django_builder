<script setup lang="ts">
import { storeToRefs } from "pinia";
import { auth } from "../firebase";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";

const router = useRouter();
const userStore = useUserStore();

const { user } = storeToRefs(userStore);

async function logout() {
  await auth.signOut();
  userStore.logoutUser();
  router.replace({ name: "login" });
}
</script>

<template>
  <div class="wrapper">
    <div class="welcome">
      <router-link :to="{ name: 'projects' }">
        <img src="/favicon-16x16.png">
      </router-link>
      <div class="welcome-text">
        Welcome to Django Builder - {{ user?.displayName || user?.email }}
      </div>
    </div>
    <slot />
    <div class="header-link">
      <router-link :to="{ name: 'projects' }">
        Projects
      </router-link>
    </div>
    <div class="header-link header-link-right">
      <button
        class="logout-button"
        @click="logout"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  margin: 4px;
  clear: both;
  display: flex;
}
.logout-button {
  display: inline;
  margin: 0;
}
.welcome {
  display: flex;
  padding: 10px;
  border: 1px dotted lightgray;
}
.welcome img {
  border: 1px dotted lightgray;
  margin-right: 10px;
}
.welcome .welcome-text {
  margin-top: 2px;
}
.header-link {
  display: inline-block;
  padding: 10px;
  border: 1px dotted lightgray;
  margin-left: 5px;
  margin-top: 2px;
}
.header-link-right {
  display: inline-block;
  padding: 8px;
  border: 1px dotted lightgray;
  margin-left: 5px;
}
</style>
