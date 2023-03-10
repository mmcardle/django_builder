<script setup lang="ts"></script>

<template>
  <span class="wrapper">
    <span class="popup">
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
  left: -50px;
  top: 0;
  position: absolute;
  min-width: 150px;
  box-shadow: rgba(17, 17, 26, 0.1) 0px 8px 24px,
    rgba(17, 17, 26, 0.1) 0px 16px 56px, rgba(17, 17, 26, 0.1) 0px 24px 80px;
}
</style>
