<template>
  <div>
    <v-autocomplete
      :rules="rules" :label="label" :value="value"
      :multiple="multi" :required="required"
      :items="items"
      @input="$emit('input', $event);">
    </v-autocomplete>
  </div>
</template>
<script>
export default {
  name: 'SelectListObjects',
  props: ['multi', 'options', 'name', 'label', 'value', 'required', 'nospaces'],
  computed: {
    items ()  {
      return Object.keys(this.options).map((k) => {
        return {text: k, value: this.options[k]}
      })
    },
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
