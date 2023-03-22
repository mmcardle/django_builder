<script setup lang="ts">
import { FieldTypes, RelationshipTypes } from '@djangobuilder/core';
import type { DjangoApp, DjangoField, DjangoModel, DjangoRelationship } from '@djangobuilder/core';

import EditableChoice from "@/widgets/EditableChoice.vue";
import EditableText from "@/widgets/EditableText.vue";

const props = defineProps<{
  app: DjangoApp;
}>();

const emit = defineEmits<{
  (e: "updateModel", djangoFile: DjangoModel, args: Record<string, string | boolean | number>): void;
  (e: "updateRelationship", djangoFile: DjangoRelationship, args: Record<string, string | boolean | number>): void;
  (e: "updateField", djangoFile: DjangoField, args: Record<string, string | boolean | number>): void;
}>();

const fieldChoices: Record<string, string> = {};
Object.keys(FieldTypes).forEach((fieldType) => {
  fieldChoices[fieldType] = fieldType;
});

const relationshipChoices: Record<string, string> = {};
Object.keys(RelationshipTypes).forEach((relationshipType) => {
  relationshipChoices[relationshipType] = relationshipType;
});

</script>

<template>
  <div>
    {{ "&nbsp;" }}
    <div v-for="model in (app as DjangoApp).models" :key="model.name">
      {{ "class "
      }}<EditableText :value="model.name"
        v-on:update="(name: string) => emit('updateModel', model as DjangoModel, { name })">
        {{ model.name }}
      </EditableText>(
        {{ model.parents.map((p) => p.name).join(", ") }}
      ):
      <br />
      <br />
      <div v-for="relationship in model.relationships" :key="relationship.name">
        {{ "&nbsp;&nbsp;" }}
        <EditableText :value="relationship.name" 
        v-on:update="(name) => emit('updateRelationship', relationship as DjangoRelationship, { name })">
          {{ relationship.name }}
        </EditableText>
        =
        <EditableChoice :value="relationship.type.name" :choices="relationshipChoices"
          v-on:update="(type) => emit('updateRelationship', relationship as DjangoRelationship, { type })">
          {{ relationship.type.name }}
        </EditableChoice>(
          <EditableText :value="relationship.args"
            v-on:update="(args) => emit('updateRelationship', relationship as DjangoRelationship, { args })">
          {{ relationship.args }}
          </EditableText>
        )
      </div>
      <div>
        {{ "&nbsp;&nbsp;" }}
        <button>Add Relationship</button>
      </div>
      <br />
      <div v-for="field in model.fields" :key="field.name">
        {{ "&nbsp;&nbsp;" }}
        <EditableText :value="field.name"
          v-on:update="(name) => emit('updateField', field as DjangoField, { name })">
          {{ field.name }}
        </EditableText>
        =
        <EditableChoice :value="field.type.name" :choices="fieldChoices"
          v-on:update="(type) => emit('updateField', field as DjangoField, { type })">{{ field.type.name }}
        </EditableChoice>

        (<EditableText :value="field.args"
          v-on:update="(args) => emit('updateField', field as DjangoField, { args })">
          {{ field.args }} </EditableText>)
      </div>
      <div>
        {{ "&nbsp;&nbsp;" }}
        <button>Add Field</button>
      </div>
      {{ "&nbsp;" }}
    </div>
  </div>
</template>

<style scoped>
button {
  margin-top: 10px;
  border: none;
}
</style>