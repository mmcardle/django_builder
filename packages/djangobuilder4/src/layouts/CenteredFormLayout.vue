<template>
  <main>
    <div class="wrapper">
      <slot />
    </div>
  </main>
</template>

<style scoped>
main {
  height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}
.wrapper {
  max-width: 50vw;
  border: 1px dotted lightgray;
  padding: 10px 30px;
  display: flex;
  flex-direction: column;
}
</style>
