<script setup lang="ts">
import { auth } from "../firebase";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";

const router = useRouter();
const userStore = useUserStore();

const user = userStore.getUser;

async function logout() {
  await auth.signOut();
  userStore.logoutUser();
  router.replace({ name: "login" });
}
</script>

<template>
  <div class="wrapper">
    <div class="welcome">
      Welcome to Django Builder - {{ user?.displayName || user?.email }}
    </div>
    <slot></slot>
    <div class="header-link">
      <router-link :to="{ name: 'projects' }">Projects</router-link>
    </div>
    <div class="header-link header-link-right">
      <button class="logout-button" @click="logout">Logout</button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  margin: 4px;
  clear: both;
}
.logout-button {
  display: inline;
  margin: 0;
}
.welcome {
  display: inline-block;
  padding: 10px;
  border: 1px dotted lightgray;
}
.header-link {
  display: inline-block;
  padding: 10px;
  border: 1px dotted lightgray;
  margin-left: 5px;
}
.header-link-right {
  display: inline-block;
  padding: 10px;
  border: 1px dotted lightgray;
  margin-left: 5px;
}
</style>
