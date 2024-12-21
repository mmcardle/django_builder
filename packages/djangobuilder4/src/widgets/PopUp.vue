<script setup lang="ts">
const props = defineProps<{
  location?: string;
}>();

let popupClass = "popup-left";

switch (props.location) {
  case "right":
    popupClass = "popup-right";
    break;
}
</script>

<template>
  <span class="wrapper">
    <span class="popup" :class="popupClass">
      <slot></slot>
    </span>
  </span>
</template>

<style scoped>
.wrapper {
  position: relative;
  z-index: 100;
}
.popup {
  z-index: 100;
  background-color: white;
  border: 1px dotted lightgray;
  margin: 0;
  padding: 4px;
  top: 0;
  position: absolute;
  min-width: 200px;
  box-shadow: rgba(17, 17, 26, 0.1) 0px 8px 24px,
    rgba(17, 17, 26, 0.1) 0px 16px 56px, rgba(17, 17, 26, 0.1) 0px 24px 80px;
}
.popup-left {
  left: 0;
}
.popup-right {
  right: 0;
}
</style>
