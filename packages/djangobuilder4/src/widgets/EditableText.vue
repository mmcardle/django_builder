<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from "vue";

export interface Props {
  value: string;
  remain_open?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: "",
  remain_open: false,
  block: false,
});

const emit = defineEmits<{
  (e: "update", value: string): void;
  (e: "abort"): void;
}>();

const editRef = ref();
const editing = ref(props.remain_open);
const aborted = ref(false);
const editedValue = ref(props.value);

function handleEdit() {
  editing.value = props.remain_open || true;
  nextTick(() => {
    editRef.value.focus();
  });
}

watch(
  () => props.value,
  (newValue) => {
    editedValue.value = newValue;
  }
);

function handleFinishEdit() {
  if (!aborted.value) {
    emit("update", editedValue.value);
  }
  editing.value = props.remain_open || false;
}

function handleAbortEdit(): void {
  aborted.value = true;
  editing.value = props.remain_open || false;
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
      :class="props.block ? 'block' : ''"
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
  padding: 1px 0px 2px 0px;
  border-top-style: hidden;
  border-right-style: hidden;
  border-left-style: hidden;
  border-bottom-style: hidden;
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
.block {
  width: 100%;
}
</style>
