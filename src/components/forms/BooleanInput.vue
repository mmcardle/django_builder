<template>
  <div>
     <v-switch v-model="val" :label="label"
        @change="$emit('input', $event);" color="primary"
      ></v-switch>
  </div>
</template>
<script>
export default {
  name: 'BooleanInput',
  data: () => ({
    val: undefined
  }),
  created: function () {
    this.val = this.value
  },
  props: [
    'label', 'name', 'value', 'required'
  ],
  computed: {
    rules () {
      console.log('BooleanInput', this.label, this.value)
      return []
    }
  },
}
</script>
