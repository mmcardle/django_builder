<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import PopUp from "@/widgets/PopUp.vue";

export interface Props {
  value: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: "",
  title: "Input",
});

const emit = defineEmits<{
  (e: "update", value: string): void;
  (e: "abort"): void;
}>();

const editRef = ref();
const aborted = ref(false);
const editedValue = ref(props.value);

function handleEdit() {
  nextTick(() => {
    editRef.value.focus();
  });
}

onMounted(() => {
  nextTick(() => {
    handleEdit();
  });
});

function handleFinishEdit() {
  if (!aborted.value) {
    emit("update", editedValue.value);
  }
}

function handleAbortEdit(): void {
  aborted.value = true;
  editedValue.value = props.value;
  emit("abort");
}
</script>

<template>
  <PopUp>
    <div class="wrapper">
      <label>
        {{ title }}
        <input
          ref="editRef"
          type="text"
          v-model="editedValue"
          size="15"
          @keydown.escape="handleAbortEdit"
        />
      </label>
      <button @click="handleFinishEdit">OK</button>
      <button class="cancel" @click="handleAbortEdit()">&#10539;</button>
    </div>
  </PopUp>
</template>

<style scoped>
.wrapper {
  white-space: nowrap;
}
label {
  display: inline-block;
}
button {
  margin-left: 4px;
}
button.cancel {
  color: red;
}
</style>
