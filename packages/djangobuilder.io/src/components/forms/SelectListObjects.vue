<template>
  <div>
    <v-autocomplete
      :rules="rules"
      :label="label"
      :value="value"
      :multiple="multi"
      :required="required"
      :items="options"
      chips
      @input="$emit('input', $event);">
    </v-autocomplete>
  </div>
</template>
<script>
export default {
  name: 'SelectListObjects',
  props: ['multi', 'options', 'name', 'label', 'value', 'required', 'nospaces'],
  mounted() {
    console.debug(
      "SelectListObjects mounted", this.options
    )
    console.debug(
      "SelectListObjects value", this.value
    )
  },
  computed: {
    rules () {
      const rules = []

      if (this.required) {
        const rule = (v) => (!!v || 'This field is required')
        rules.push(rule)
      }

      if (this.max) {
        const rule = v => (v || '').length <= this.max || `A maximum of ${this.max} characters is allowed`
        rules.push(rule)
      }

      if (this.nospaces) {
        const rule = v => (v || '').indexOf(' ') < 0 || 'No spaces are allowed'
        rules.push(rule)
      }

      return rules
    }
  },
}
</script>
