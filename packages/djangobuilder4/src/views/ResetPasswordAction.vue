<template>
  <div>
    <p>Reset Password</p>
    <template v-if="!reset">
      <div v-if="error">Error {{ error }}</div>
      <form @submit.prevent v-else>
        <input name="email" v-model="email" readonly />
        <input
          name="login"
          type="password"
          v-model="password1"
          autocomplete="new-password"
        />
        <input
          name="login"
          type="password"
          v-model="password2"
          autocomplete="new-password"
        />
        <button @click="resetPassword">Reset</button>
      </form>
    </template>
    <template v-else>
      <p>
        Password Reset!
        <router-link :to="{ name: 'login' }">login</router-link>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { auth } from "../firebase";
import { checkActionCode, confirmPasswordReset } from "firebase/auth";
import { useRouter } from "vue-router";

const props = defineProps(["oobCode"]);

const router = useRouter();
const email = ref("");
const invalid = ref(false);
const reset = ref(false);
const password1 = ref("");
const password2 = ref("");
const error = ref(null as string | null);
const emailError = ref("");
const password1Error = ref("");
const password2Error = ref("");

onMounted(() => {
  checkActionCode(auth, props.oobCode)
    .then((result) => {
      email.value = result.data.email as string;
    })
    .catch((firebaseError) => {
      error.value = firebaseError.message;
      invalid.value = true;
    });
});

function resetPassword() {
  error.value = "";
  emailError.value = "";
  password1Error.value = "";
  password2Error.value = "";
  if (!password1.value) {
    password1Error.value = "Please provide a new password.";
    return;
  }
  if (!password2.value) {
    password2Error.value = "Please enter your password a second time.";
    return;
  }
  if (password1.value !== password2.value) {
    password2Error.value = "Those passwords do not match.";
    return;
  }

  confirmPasswordReset(auth, props.oobCode, password1.value).then(
    () => {
      reset.value = true;
      router.push({ name: "login" });
    },
    (firebaseError) => {
      error.value = firebaseError.message;
    }
  );
}
</script>
