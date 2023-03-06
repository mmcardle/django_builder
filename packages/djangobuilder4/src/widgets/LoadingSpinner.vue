<template>
  <div class="loading-ring">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>

<style scoped>
.loading-ring {
  position: fixed;
  width: 80px;
  height: 80px;
  margin: auto;
  left: 10px;
  right: 10px;
}
.loading-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid gray;
  border-radius: 50%;
  animation: loading-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: gray transparent transparent transparent;
}
.loading-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.loading-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.loading-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes loading-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
