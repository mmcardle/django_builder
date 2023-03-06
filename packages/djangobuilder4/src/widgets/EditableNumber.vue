<script setup lang="ts">
import { ref, nextTick } from "vue";

const props = defineProps<{
  value: number;
}>();

const emit = defineEmits<{
  (e: "update", value: number): void;
  (e: "abort"): void;
}>();

const editRef = ref();
const editing = ref(false);
const aborted = ref(false);
const editedValue = ref(props.value);

function handleEdit() {
  editing.value = true;
  nextTick(() => {
    editRef.value.focus();
  });
}

function handleFinishEdit() {
  if (!aborted.value) {
    emit("update", editedValue.value);
  }
  editing.value = false;
}

function handleAbortEdit(): void {
  aborted.value = true;
  editing.value = false;
  editedValue.value = props.value;
  emit("abort");
}
</script>

<template>
  <span @click="handleEdit" v-if="!editing">
    <slot></slot>
  </span>
  <template v-else>
    <input
      ref="editRef"
      type="number"
      v-model="editedValue"
      @blur="handleFinishEdit"
      @keydown.enter="handleFinishEdit"
      @keydown.escape="handleAbortEdit"
    />
  </template>
</template>

<style scoped>
span {
  display: inline-block;
  cursor: pointer;
  border-bottom: 1px dashed gray;
  margin-top: 1px;
  padding-bottom: 1px;
}
</style>
