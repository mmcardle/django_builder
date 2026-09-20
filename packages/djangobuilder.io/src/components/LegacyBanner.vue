<template>
  <div v-if="visible" class="legacy-banner d-flex align-center px-4 py-2" role="status">
    <span class="flex-grow-1">
      You're using the legacy Django Builder.
      <a href="/" class="legacy-banner__link font-weight-bold ml-1">Try the new version</a>
    </span>
    <button type="button" class="legacy-banner__dismiss ml-4" aria-label="Dismiss" @click="dismiss">&times;</button>
  </div>
</template>

<script>
const STORAGE_KEY = 'legacy_banner_dismissed'

export default {
  name: 'LegacyBanner',
  data () {
    return {
      visible: localStorage.getItem(STORAGE_KEY) !== 'true',
    }
  },
  methods: {
    dismiss () {
      localStorage.setItem(STORAGE_KEY, 'true')
      this.visible = false
    },
  },
}
</script>

<style scoped>
.legacy-banner {
  background: #263238;
  color: #fff;
}
.legacy-banner__link {
  color: #ffab40;
}
.legacy-banner__dismiss {
  background: none;
  border: 0;
  color: inherit;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}
</style>
