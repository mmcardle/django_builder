<script setup lang="ts">
import { ref, withDefaults } from "vue";

export interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: "Confirm",
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
  <span class="buttons">
    <button class="button" @click="handleConfirm()">&#10539;</button>
    <span class="confirm-popup" v-if="confirming">
      {{ message }}
      <button class="cancel-button" @click="handleAbortConfirm()">
        Cancel
      </button>
      <button class="confirm-button" @click="handleEndConfirm()">
        Confirm
      </button>
    </span>
  </span>
</template>

<style scoped>
.buttons {
  margin: 5px;
  position: relative;
}
.button {
  margin: 0;
  padding: 0 4px;
  color: red;
}
.confirm-popup {
  z-index: 100;
  background-color: white;
  border: 1px dotted lightgray;
  margin: 0;
  padding: 4px;
  left: 0;
  top: 0;
  position: absolute;
  min-width: 150px;
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
