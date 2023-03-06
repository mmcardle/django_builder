<script setup lang="ts">
import { updateRelationship } from "../api";
import EditableText from "@/widgets/EditableText.vue";
import EditableChoice from "../widgets/EditableChoice.vue";
import type { DjangoRelationship } from "@djangobuilder/core";

defineProps<{
  relationship: DjangoRelationship;
}>();

</script>

<template>
  <div>
    &nbsp;&nbsp;
    <EditableText
      :value="relationship.name"
      v-on:update="(name) => updateRelationship(relationship, { name })"
    >
      <span>{{ relationship.name }}</span>
    </EditableText>
    =
    <EditableChoice
      :value="relationship.type.name"
      :choices="{
        'django.db.models.ForeignKey': 'django.db.models.ForeignKey',
        'django.db.models.OneToOneField': 'django.db.models.OneToOneField',
        'django.db.models.ManyToManyField': 'django.db.models.ManyToManyField',
      }"
      v-on:update="(type) => updateRelationship(relationship, { type })"
      >{{ relationship.type.name }}</EditableChoice
    >("<EditableText
      :value="relationship.to.name"
      v-on:update="(to) => updateRelationship(relationship, { to })"
    >
      <span>{{ relationship.relatedTo() }}</span> </EditableText
    >",
    <EditableText
      :value="relationship.args"
      v-on:update="(args) => updateRelationship(relationship, { args })"
    >
      <span>{{ relationship.args }}</span> </EditableText
    >)
  </div>
</template>
