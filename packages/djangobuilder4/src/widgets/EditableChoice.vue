<script setup lang="ts">
import { ref, nextTick } from "vue";

export interface Props {
  value: string;
  choices: object | string[];
  display_as?: string;
  remain_open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: "",
  title: "Input",
  display_as: "select",
  remain_open: false,
});

const randomname = (Math.random() + 1).toString(36).substring(7);

const emit = defineEmits<{
  (e: "update", value: string): void;
  (e: "abort"): void;
}>();

const editRef = ref();
const editing = ref(props.remain_open);
const aborted = ref(false);
const editedValue = ref(props.value);

const isArray = ref(props.choices instanceof Array);

function handleEdit() {
  editing.value = props.remain_open || true;
  nextTick(() => {
    if (editRef.value) {
      editRef.value.focus();
    }
  });
}

function handleFinishEdit() {
  if (!aborted.value) {
    emit("update", editedValue.value);
  }
  editing.value = props.remain_open || false;
}

function handleChange() {
  if (!aborted.value) {
    emit("update", editedValue.value);
  }
}

function handleAbortEdit(): void {
  aborted.value = true;
  editing.value = props.remain_open || false;
  editedValue.value = props.value;
  emit("abort");
}
</script>

<template>
  <template v-if="display_as === 'select'">
    <span @click="handleEdit" v-if="!editing">
      <slot>{{ value }}</slot>
      <em v-if="editedValue === ''">Click to edit</em>
    </span>
    <template v-else>
      <select
        ref="editRef"
        @blur="handleFinishEdit"
        @change="handleChange"
        @keydown.escape="handleAbortEdit"
        v-model="editedValue"
      >
        <template v-if="!isArray">
          <option v-for="choice in (choices as object)" :key="choice">
            {{ choice }}
          </option>
        </template>
        <template v-if="isArray">
          <option v-for="choice in choices" :key="choice">
            {{ choice }}
          </option>
        </template>
      </select>
    </template>
  </template>

  <template v-if="display_as === 'radio'">
    <span @click="handleEdit" v-if="!editing">
      <slot>{{ value }}</slot>
    </span>
    <span v-else class="radios">
      <template v-for="(choice_key, choice_value) in choices" :key="choice_key">
        <label class="radio-label">
          <input
            class="radio-input"
            type="radio"
            v-model="editedValue"
            :value="choice_value"
            :name="randomname"
            :checked="choice_value === value"
            @click="handleFinishEdit"
            @keydown.escape="handleAbortEdit"
          />{{ choice_key }}
        </label>
      </template>
    </span>
  </template>
</template>

<style scoped>
input {
  padding: 0px 0px;
}
span {
  display: inline-block;
  cursor: pointer;
  border-bottom: 1px dashed gray;
  margin-top: 1px;
  padding-bottom: 1px;
}
.radio-label {
  margin-right: 8px;
}
.radio-input {
  margin-top: -1px;
  vertical-align: middle;
  margin-left: 0;
}
</style>
