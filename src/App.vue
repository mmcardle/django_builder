<template>
  <v-app id="django_builder">
    <main-content />
  </v-app>
</template>

<script>
import MainContent from '@/components/MainContent'

export default {
  components: { 'main-content': MainContent },
}
</script>
