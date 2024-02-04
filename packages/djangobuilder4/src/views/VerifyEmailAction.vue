<template>
  <div>
    <p>Verify Email ...</p>
    <template v-if="!verified">
      <div v-if="error">Error {{ error }}</div>
    </template>
    <template v-else>
      <p>Email Verified!</p>
      Now <router-link :to="{ name: 'login' }">login</router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { auth } from "../firebase";
import { applyActionCode } from "firebase/auth";

const props = defineProps({
  oobCode: String,
});

const verified = ref(false);
const error = ref(null as string | null);

onMounted(() => {
  applyActionCode(auth, props.oobCode as string).catch((firebaseError) => {
    error.value = firebaseError.message;
    verified.value = false;
  });
});
</script>
