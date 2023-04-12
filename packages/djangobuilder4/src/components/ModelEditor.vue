<script setup lang="ts">
import { reactive, ref } from "vue";
import { useUserStore } from "@/stores/user";

import {
  BuiltInModelTypes,
  FieldTypes,
  RelationshipTypes,
} from "@djangobuilder/core";
import type {
  DjangoApp,
  DjangoField,
  DjangoModel,
  DjangoRelationship,
} from "@djangobuilder/core";

import PopUp from "@/widgets/PopUp.vue";
import EditableChoice from "@/widgets/EditableChoice.vue";
import EditableText from "@/widgets/EditableText.vue";
import ConfirmableButton from "@/widgets/ConfirmableButton.vue";

defineProps<{
  app: DjangoApp;
}>();

const emit = defineEmits<{
  (
    e: "updateModel",
    djangoFile: DjangoModel,
    args: Record<string, string | boolean | number>
  ): void;
  (
    e: "updateRelationship",
    djangoFile: DjangoRelationship,
    args: Record<string, string | boolean | number>
  ): void;
  (
    e: "updateField",
    djangoFile: DjangoField,
    args: Record<string, string | boolean | number>
  ): void;
}>();

const userStore = useUserStore();

const addingField = ref("");
const addingRelationship = ref("");

const fieldTypeChoices = Object.keys(FieldTypes);
const relationshipTypeChoices = Object.keys(RelationshipTypes);
const relationshipToChoices = Object.keys(BuiltInModelTypes);

type NewFieldData = {
  name: string;
  type: string;
  args: string;
};

const defaultFieldData = {
  name: "field",
  type: "CharField",
  args: FieldTypes["CharField"].argsDefault || "",
};
const newFieldData = reactive<NewFieldData>(defaultFieldData);

type NewRelationshipData = {
  name: string;
  type: string;
  to: string;
  args: string;
};

const defaultRelationshipData = {
  name: "field",
  type: "ForeignKey",
  to: "",
  args: "",
};
const newRelationshipData = reactive<NewRelationshipData>(
  defaultRelationshipData
);

async function handleAddField(model: DjangoModel) {
  await userStore.addField(
    model,
    newFieldData.name,
    newFieldData.type,
    newFieldData.args
  );
  addingField.value = "";
}

async function handleAddRelationship(model: DjangoModel) {
  await userStore.addRelationship(
    model,
    newRelationshipData.name,
    newRelationshipData.type,
    newRelationshipData.to,
    newRelationshipData.args
  );
  addingRelationship.value = "";
}

async function handleDeleteField(field: DjangoField) {
  await userStore.deleteField(field);
}

async function handleDeleteRelationship(relationship: DjangoRelationship) {
  await userStore.deleteRelationship(relationship);
}

function updateFieldType(type: string) {
  newFieldData.type = type;
  const defaultArgs = FieldTypes[type].argsDefault;
  newFieldData.args = defaultArgs || "";
}
</script>

<template>
  <div>
    {{ "&nbsp;" }}
    <div v-for="model in (app as DjangoApp).models" :key="model.id">
      {{ "class "
      }}<EditableText
        :value="model.name"
        v-on:update="(name: string) => emit('updateModel', model as DjangoModel, { name })"
      >
        {{ model.name }} </EditableText
      >(
      {{ model.parents.map((p) => p.name).join(", ") }}
      ):
      <br />
      <br />
      <div v-for="relationship in model.relationships" :key="relationship.id">
        <ConfirmableButton
          class="delete-button"
          @confirm="() => handleDeleteRelationship(relationship)"
        >
          &#10539;
        </ConfirmableButton>
        {{ "&nbsp;" }}
        <EditableText
          :value="relationship.name"
          v-on:update="(name) => emit('updateRelationship', relationship as DjangoRelationship, { name })"
        >
          {{ relationship.name }}
        </EditableText>
        =
        <EditableChoice
          :value="relationship.type.name"
          :choices="relationshipTypeChoices"
          v-on:update="(type) => emit('updateRelationship', relationship as DjangoRelationship, { type })"
        >
          {{ relationship.type.name }} </EditableChoice
        >(
        <EditableChoice
          :value="relationship.to.name"
          :choices="relationshipToChoices"
          v-on:update="(to) => emit('updateRelationship', relationship as DjangoRelationship, { to })"
        >
          {{ relationship.to.name }}
        </EditableChoice>
        ,
        <EditableText
          :value="relationship.args"
          v-on:update="(args) => emit('updateRelationship', relationship as DjangoRelationship, { args })"
        >
          {{ relationship.args }}
        </EditableText>
        )
      </div>
      <div>
        {{ "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" }}
        <button class="add-button" @click="addingRelationship = model.id">
          Add Relationship
        </button>
        <PopUp v-if="addingRelationship === model.id" location="left">
          Add Relationship
          <table>
            <tr>
              <td>Name</td>
              <td>
                <EditableText
                  :value="newRelationshipData.name"
                  :remain_open="true"
                  block
                  v-on:update="(value) => (newRelationshipData.name = value)"
                >
                  {{ newRelationshipData.name }}
                </EditableText>
              </td>
            </tr>
            <tr>
              <td>Type</td>
              <td>
                <EditableChoice
                  :value="newRelationshipData.type"
                  :choices="relationshipTypeChoices"
                  :remain_open="true"
                  v-on:update="updateFieldType"
                >
                  {{ newRelationshipData.type }}
                </EditableChoice>
              </td>
            </tr>
            <tr>
              <td>To</td>
              <td>
                <EditableChoice
                  :value="newRelationshipData.to"
                  :choices="relationshipToChoices"
                  :remain_open="true"
                  v-on:update="(to) => (newRelationshipData.to = to)"
                >
                  {{ newRelationshipData.type }}
                </EditableChoice>
              </td>
            </tr>
            <tr>
              <td>Args</td>
              <td>
                <EditableText
                  :value="newRelationshipData.args"
                  :remain_open="true"
                  block
                  v-on:update="(args) => (newRelationshipData.args = args)"
                >
                  {{ newRelationshipData.args }}
                </EditableText>
              </td>
            </tr>
            <tr>
              <td>
                <button @click="addingRelationship = ''">Cancel</button>
              </td>
              <td>
                <button @click="handleAddRelationship(model)">Create</button>
              </td>
            </tr>
          </table>
        </PopUp>
      </div>
      <br />
      <div v-for="field in model.fields" :key="field.id">
        <ConfirmableButton
          class="delete-button"
          @confirm="() => handleDeleteField(field)"
        >
          &#10539;
        </ConfirmableButton>
        {{ "&nbsp;" }}
        <EditableText
          :value="field.name"
          v-on:update="(name) => emit('updateField', field as DjangoField, { name })"
        >
          {{ field.name }}
        </EditableText>
        =
        <EditableChoice
          :value="field.type.name"
          :choices="fieldTypeChoices"
          v-on:update="(type) => emit('updateField', field as DjangoField, { type })"
          >{{ field.type.name }}
        </EditableChoice>

        (<EditableText
          :value="field.args"
          v-on:update="(args) => emit('updateField', field as DjangoField, { args })"
        >
          {{ field.args }} </EditableText
        >)
      </div>
      <div>
        {{ "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" }}
        <button
          class="add-button"
          :disabled="addingField !== ''"
          @click="addingField = model.id"
        >
          Add Field
        </button>
        <PopUp v-if="addingField === model.id" location="left">
          Add Field
          <table>
            <tr>
              <td>Name</td>
              <td>
                <EditableText
                  :value="newFieldData.name"
                  :remain_open="true"
                  block
                  v-on:update="(value) => (newFieldData.name = value)"
                >
                  {{ newFieldData.name }}
                </EditableText>
              </td>
            </tr>
            <tr>
              <td>Type</td>
              <td>
                <EditableChoice
                  :value="newFieldData.type"
                  :choices="fieldTypeChoices"
                  :remain_open="true"
                  v-on:update="updateFieldType"
                >
                  {{ newFieldData.type }}
                </EditableChoice>
              </td>
            </tr>
            <tr>
              <td>Args</td>
              <td>
                <EditableText
                  :value="newFieldData.args"
                  :remain_open="true"
                  block
                  v-on:update="(args) => (newFieldData.args = args)"
                >
                  {{ newFieldData.args }}
                </EditableText>
              </td>
            </tr>
            <tr>
              <td>
                <button @click="addingField = ''">Cancel</button>
              </td>
              <td>
                <button @click="handleAddField(model)">Create</button>
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
