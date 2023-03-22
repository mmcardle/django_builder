<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";

export interface Props {
  value: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: "",
});

const emit = defineEmits<{
  (e: "update", value: string): void;
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

onMounted(() => {
  nextTick(() => {
    //handleEdit();
  });
});

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
    <em v-if="value === '' && editedValue === ''">Click to edit</em>
  </span>
  <template v-else>
    <input
      ref="editRef"
      type="text"
      v-model="editedValue"
      :size="Math.max(editedValue.length - 1, 6)"
      @blur="handleFinishEdit"
      @keydown.enter="handleFinishEdit"
      @keydown.escape="handleAbortEdit"
    />
  </template>
</template>

<style scoped>
input {
  padding: 0px 0px;
  border-top-style: hidden;
  border-right-style: hidden;
  border-left-style: hidden;
  border-bottom-style: solid;
  background-color: #eee;
  outline: none;
}
span {
  display: inline-block;
  cursor: pointer;
  border-bottom: 1px dashed gray;
  margin-top: 1px;
  padding-bottom: 1px;
}
</style>
