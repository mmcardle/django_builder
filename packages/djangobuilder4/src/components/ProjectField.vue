<script setup lang="ts">
import { updateField } from "../api";
import EditableText from "@/widgets/EditableText.vue";
import type { DjangoField } from "@djangobuilder/core";

defineProps<{
  field: DjangoField;
}>();
</script>

<template>
  <div>
    &nbsp;&nbsp;
    <EditableText
      :value="field.name"
      v-on:update="(name) => updateField(field, { name })"
    >
      <span>{{ field.name }}</span>
    </EditableText>
    = {{ field.type.name }}(<EditableText
      :value="field.args"
      v-on:update="(args) => updateField(field, { args })"
    >
      <span>{{ field.args }}</span> </EditableText
    >)
  </div>
</template>
