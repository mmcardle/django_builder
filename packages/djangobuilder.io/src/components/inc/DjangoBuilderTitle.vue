<template>
  <span class="text-grey-lighten-1 small-caps font-weight-black">
    <span class="text-red-darken-2">D</span>jango
    <span class="text-red-darken-2">B</span>uilder
  </span>
</template>

<script>
export default {
  name: 'djangoBuilderTitle',
  props: ['classes'],
  computed: {
    div_class: function () {
      return 'text-grey-lighten-1 small-caps font-weight-black ' + this.classes
    }
  },
}
</script>
