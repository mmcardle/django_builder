<template>
  <span class="grey--text text--lighten-1 small-caps font-weight-black">
    <span class="red--text text--darken-2">D</span>jango
    <span class="red--text text--darken-2">B</span>uilder
  </span>
</template>

<script>
export default {
  name: 'djangoBuilderTitle',
  props: ['classes'],
  computed: {
    div_class: function () {
      return 'grey--text text--lighten-1 small-caps font-weight-black ' + this.classes
    }
  },
  data: function() {
    return {
      deletedialog: true,
    }
  },
}
</script>
