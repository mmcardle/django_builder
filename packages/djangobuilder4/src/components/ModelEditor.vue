<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';

import { FieldTypes, RelationshipTypes } from '@djangobuilder/core';
import type { DjangoApp, DjangoField, DjangoModel, DjangoRelationship } from '@djangobuilder/core';

import PopUp from "@/widgets/PopUp.vue";
import EditableChoice from "@/widgets/EditableChoice.vue";
import EditableText from "@/widgets/EditableText.vue";
import ConfirmableButton from "@/widgets/ConfirmableButton.vue";

const props = defineProps<{
  app: DjangoApp;
}>();

const emit = defineEmits<{
  (e: "updateModel", djangoFile: DjangoModel, args: Record<string, string | boolean | number>): void;
  (e: "updateRelationship", djangoFile: DjangoRelationship, args: Record<string, string | boolean | number>): void;
  (e: "updateField", djangoFile: DjangoField, args: Record<string, string | boolean | number>): void;
}>();

const userStore = useUserStore();

const addingField = ref("");

const fieldChoices: Record<string, string> = {};
Object.keys(FieldTypes).forEach((fieldType) => {
  fieldChoices[fieldType] = fieldType;
});

const relationshipChoices: Record<string, string> = {};
Object.keys(RelationshipTypes).forEach((relationshipType) => {
  relationshipChoices[relationshipType] = relationshipType;
});

type NewFieldData = {
  name: string;
  type: string;
  args: string;
};

const defaultFieldData = { name: "field", type: "CharField", args: ""};
const newFieldData = reactive<NewFieldData>(defaultFieldData);

// TODO Add field defaults
/*
watch(newFieldData, (newType, prevType) => {
  console.log("xxx2", newType, prevType)
    const defaultArgs = FieldTypes[newType].argsDefault;
    if (defaultArgs) {
      newFieldData.args = defaultArgs;
      console.log("111 TYPE UPDATED TO ", newType, defaultArgs)
    }
  })
  
  watch(
  () => newFieldData.type,
  (newType, prevType) => {
    console.log("xxx1", newType, prevType)
    const defaultArgs = FieldTypes[newType].argsDefault;
    if (defaultArgs) {
      newFieldData.args = defaultArgs;
      console.log("111 TYPE UPDATED TO ", newType, defaultArgs)
    }
  }
  )
*/

async function handleAddField(model: DjangoModel) {
  await userStore.addField(model, newFieldData.name, newFieldData.type, newFieldData.args);
  addingField.value = "";
}

async function handleDeleteField(field: DjangoField) {
  await userStore.deleteField(field);
}

async function handleDeleteRelationship(relationship: DjangoRelationship) {
  await userStore.deleteRelationship(relationship);
}

</script>

<template>
  <div>
    {{ "&nbsp;" }}
    <div v-for="model in (app as DjangoApp).models" :key="model.id">
      {{ "class "
      }}<EditableText :value="model.name"
        v-on:update="(name: string) => emit('updateModel', model as DjangoModel, { name })">
        {{ model.name }}
      </EditableText>(
        {{ model.parents.map((p) => p.name).join(", ") }}
      ):
      <br />
      <br />
      <div v-for="relationship in model.relationships" :key="relationship.id">
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
        <ConfirmableButton class="delete-button" @confirm="() => handleDeleteRelationship(relationship)">
          &#10539;
        </ConfirmableButton>
      </div>
      <div>
        {{ "&nbsp;&nbsp;" }}
        <button class="add-button">Add Relationship</button>
      </div>
      <br />
      <div v-for="field in model.fields" :key="field.id">
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
        <ConfirmableButton class="delete-button" @confirm="() => handleDeleteField(field)">
          &#10539;
        </ConfirmableButton>
      </div>
      <div>
        {{ "&nbsp;&nbsp;" }}
        <button class="add-button" :disabled="addingField !== ''" @click="addingField = model.id">Add Field</button>
        <PopUp v-if="addingField === model.id" location="left">
          Add Model
          <table>
            <tr>
              <td>Name</td>
              <td>
                <EditableText
                  :value="newFieldData.name"
                  v-on:update="(value) => (newFieldData.name = value)"
                >
                  {{ newFieldData.name }}
                </EditableText>
              </td>
            </tr>
            <tr>
              <td>Type</td>
              <td>
                <EditableChoice :value="newFieldData.type" :choices="fieldChoices"
                  v-on:update="(type) => (newFieldData.type = type)">
                  {{ newFieldData.type }}
                </EditableChoice>
              </td>
            </tr>
            <tr>
              <td>Args</td>
              <td>
                <EditableText
                  :value="newFieldData.args"
                  v-on:update="(args) => (newFieldData.args = args)"
                >
                  {{ newFieldData.args }}
                </EditableText>
              </td>
            </tr>
            <tr>
              <td>
                <button
                  id="cancel-project-button"
                  @click="addingField = ''"
                >
                  Cancel
                </button>
              </td>
              <td>
                <button
                  id="create-model-button"
                  @click="handleAddField(model)"
                >
                  Create
                </button>
              </td>
            </tr>
          </table>
        </PopUp>
      </div>
      {{ "&nbsp;" }}
    </div>
  </div>
</template>

<style scoped>
.add-button {
  margin-top: 10px;
  border: none;
}
.delete-button {
  border: none;
}
</style>