<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  value: boolean;
}>();

const emit = defineEmits<{
  (e: "update", value: boolean): void;
}>();

const editedValue = ref(props.value);

function handleEdit() {
  editedValue.value = !editedValue.value;
  emit("update", editedValue.value);
}
</script>

<template>
  <span class="boolean-wrapper" @click="handleEdit">
    <slot>
      <span v-if="value" class="true"> yes</span>
      <span v-else class="false"> no</span>
    </slot>
  </span>
</template>

<style scoped>
span.boolean-wrapper {
  display: inline-block;
  cursor: pointer;
  border-bottom: 1px dashed gray;
  margin-top: 1px;
}
span.false {
  display: inline-block;
  margin-top: 1px;
}
span.true::before {
  content: "\2713";
}
span.false::before {
  content: "\292B";
}
</style>
