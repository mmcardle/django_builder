<script setup lang="ts">
import { ref } from "vue";
import { sendPasswordResetEmail } from "@firebase/auth";
import { auth } from "../firebase";
import CenteredFormLayout from "@/layouts/CenteredFormLayout.vue";

const reset = ref(false);
const email = ref("");
const error = ref("");
const errors = ref({});

function resetPassword() {
  if (!email.value) {
    errors.value = { email: true };
    error.value = "Please provide your email.";
    return;
  }
  sendPasswordResetEmail(auth, email.value)
    .then(() => {
      reset.value = true;
    })
    .catch((error) => {
      console.log(error);
      reset.value = true;
    });
}
</script>

<template>
  <CenteredFormLayout>
    <h3>Reset Password</h3>
    <template v-if="!reset">
      <div :value="error">
        {{ error }}
      </div>
      <label>
        Email
        <input
          v-model="email"
          name="login"
          label="Email"
          type="text"
          autocomplete="email"
        >
      </label>
      <button @click="resetPassword">
        Reset
      </button>
      <div class="cancel">
        <router-link to="login">
          Cancel
        </router-link>
      </div>
    </template>
    <template v-else>
      <p>
        A password reset email has been sent to your email address. Once you
        reset your password you can
        <router-link :to="{ name: 'login' }">
          login
        </router-link>
      </p>
    </template>
  </CenteredFormLayout>
</template>

<style scoped lang="scss">
@import "../assets/forms.css";
.cancel {
  text-align: center;
  margin-top: 10px;
}
</style>
