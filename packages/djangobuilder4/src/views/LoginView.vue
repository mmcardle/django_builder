<script setup lang="ts">
import { ref } from "vue";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously,
} from "@firebase/auth";
import { useRouter } from "vue-router";
import { auth } from "../firebase";
import { useUserStore } from "../stores/user";
import CenteredFormLayout from "../layouts/CenteredFormLayout.vue";
import LoadingSpinner from "../widgets/LoadingSpinner.vue";

const router = useRouter();
const isLoading = ref(false);

const username = ref("");
const password = ref("");

const userStore = useUserStore();

async function handleSignInAnonymously() {
  if (!isLoading.value) {
    await signInAnonymously(auth)
      .then((userData) => {
        console.log("signInAnonymously", userData);
        userStore.loginUser(userData.user);
        router.push({ name: "projects" });
      })
      .catch(function (error) {
        console.log("signInAnonymously error", error);
      })
      .finally(() => {
        isLoading.value = false;
      });
  }
}

async function handleLogin() {
  if (!isLoading.value) {
    isLoading.value = true;
    signInWithEmailAndPassword(getAuth(), username.value, password.value)
      .then((userData) => {
        isLoading.value = false;
        userStore.loginUser(userData.user);
        router.push({ name: "projects" });
      })
      .catch((err) => {
        isLoading.value = false;
        console.error(
          "There is no user record corresponding to this identifier. The user may be deleted",
          err
        );
      });
  }
}
</script>

<template>
  <CenteredFormLayout>
    <h3>Login to Django Builder</h3>
    <div id="loading">
      <LoadingSpinner v-if="isLoading" />
    </div>
    <form @submit.prevent class="login-form">
      <div>
        <label
          >Username
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            autocomplete="username"
            :disabled="isLoading"
          />
        </label>
      </div>
      <div>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            autocomplete="current-password"
            :disabled="isLoading"
          />
        </label>
      </div>
      <button @click="handleLogin" :disabled="isLoading">Login</button>
    </form>
    <div class="forgot-password">
      <router-link to="reset_password">Forgot Password</router-link>
    </div>
    <div class="login-anonymously">
      <button @click="handleSignInAnonymously" :disabled="isLoading">
        Sign In Anonymously
      </button>
    </div>
  </CenteredFormLayout>
</template>

<style scoped lang="scss">
@import "../assets/forms.css";

#loading {
  text-align: center;
  display: flex;
  justify-content: center;
}

.forgot-password {
  text-align: center;
  margin-top: 10px;
}
.login-anonymously {
  margin-top: 10px;
}
</style>
