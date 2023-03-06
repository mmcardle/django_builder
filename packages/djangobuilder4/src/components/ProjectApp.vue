<script setup lang="ts">
import { updateApp, updateModel } from "../api";
import EditableText from "@/widgets/EditableText.vue";
import ProjectField from "./ProjectField.vue";
import ProjectRelationship from "./ProjectRelationship.vue";
import type { DjangoApp } from "@djangobuilder/core";

defineProps<{
  app: DjangoApp;
}>();
</script>

<template>
  <div style="margin-top: 10px">
    <EditableText
      :value="app.name"
      v-on:update="(name) => updateApp(app, { name })"
    >
      <div>{{ app.name }}</div>
    </EditableText>
    {{ "/ models.py" }}
  </div>

  <code>
    <div>{{ "from django.db import models" }}</div>
    <div>{{ "&nbsp;" }}</div>
    <div>{{ "&nbsp;" }}</div>
    <div v-for="model in app.models" v-bind:key="model.name">
      <div>
        class
        <EditableText
          :value="model.name"
          v-on:update="(name) => updateModel(model, { name })"
        >
          <span>{{ model.name }}</span>
        </EditableText>
        <template v-if="model.parents.length > 0">
          ({{ model.parents.join(", ") }})
        </template>
        <template v-else>(models.Model):</template>
      </div>
      <div>{{ "&nbsp;" }}</div>
      <div
        v-for="relationship in model.relationships"
        v-bind:key="relationship.name"
      >
        <ProjectRelationship :relationship="relationship" />
      </div>
      <div v-for="field in model.fields" v-bind:key="field.name">
        <ProjectField :field="field" />
      </div>
      <div>{{ "&nbsp;" }}</div>
    </div>
  </code>
</template>
