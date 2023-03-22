<script setup lang="ts">
import { ref, withDefaults } from "vue";
import PopUp from "./PopUp.vue";

export interface Props {
  message?: string;
  text?: string;
  style?: string;
}

withDefaults(defineProps<Props>(), {
  message: "Confirm",
  text: "",
  style: "",
});

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "abort"): void;
}>();

const confirming = ref(false);

function handleConfirm() {
  confirming.value = true;
}

function handleEndConfirm() {
  confirming.value = false;
  emit("confirm");
}

function handleAbortConfirm(): void {
  confirming.value = false;
  emit("abort");
}
</script>

<template>
  <span class="wrapper">
    <button :style="style" class="button" @click="handleConfirm()">
      {{ text }}
      <slot></slot>
    </button>
    <PopUp v-if="confirming">
      <div>
        {{ message }}
      </div>
      <button class="cancel-button" @click="handleAbortConfirm()">Cancel</button>
      <button class="confirm-button" @click="handleEndConfirm()">Confirm</button>
    </PopUp>
  </span>
</template>

<style scoped>
.button {
}
.confirm-button {
  color: red;
  margin-top: 4px;
  margin-left: 4px;
}
.cancel-button {
  margin-top: 4px;
}
</style>
