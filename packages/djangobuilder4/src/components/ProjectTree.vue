<script setup lang="ts">
import { ref } from "vue";
import type { DjangoProject } from "@djangobuilder/core/";
import type { DjangoProjectFile } from "@djangobuilder/core/src/rendering";

const props = defineProps<{
  project: DjangoProject;
  tree: DjangoProjectFile[];
  spacing: number;
  open: boolean;
  active: string;
}>();

const emit = defineEmits<{
  (e: "click", djangoFile: DjangoProjectFile): void;
}>();

const spacings = Array.from(Array(props.spacing).keys());
const openState = ref(props.tree.map(() => props.open));

function handleClick(djangoFile: DjangoProjectFile): void {
  emit("click", djangoFile);
}

function folderClick(i: number): void {
  openState.value[i] = !openState.value[i];
}
</script>

<template>
  <div id="content">
    <div v-for="(djangoFile, i) in tree" :key="djangoFile.path">
      <div class="folder" v-if="djangoFile.folder">
        <div class="item" @click="folderClick(i)">
          <span v-for="space in spacings" :key="space" class="space"></span>
          <span :class="openState[i] ? 'foldername-open' : 'foldername-closed'">
            {{ djangoFile.name }}
          </span>
        </div>
      </div>
      <div v-else class="file">
        <div
          class="item"
          :class="djangoFile.path === active ? 'active' : ''"
          @click="() => emit('click', djangoFile)"
        >
          <span v-for="space in spacings" :key="space" class="space"></span>
          <span class="filename">{{ djangoFile.name }}</span>
        </div>
      </div>

      <div
        class="folder-children"
        v-if="djangoFile.folder"
        v-show="openState[i]"
      >
        <ProjectTree
          v-if="djangoFile.children"
          :project="project"
          :spacing="spacing + 1"
          :tree="djangoFile.children"
          :open="false"
          :active="active"
          v-on:click="handleClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.space {
  display: inline-block;
  width: 5px;
  margin-left: 1px;
}
.file,
.folder {
  display: inline-block;
  width: 100%;
  cursor: pointer;
  margin-left: 2px;
}
.item:hover {
  background-color: lightgray;
  width: 100%;
  display: inline-block;
}
.filename::before {
  content: "\00a0 \25A0  ";
}
.foldername-open::before {
  content: "\1F4C2  ";
}
.foldername-closed::before {
  content: "\1F4C1  ";
}
.active {
  color: rgb(161, 43, 22);
}
</style>
