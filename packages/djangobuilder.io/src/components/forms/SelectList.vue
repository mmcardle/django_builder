<template>
  <div>
    <v-autocomplete
      :rules="rules" :label="label" v-model="model"
      :multiple="multi" :required="required"
      :items="Object.keys(options)">
    </v-autocomplete>
  </div>
</template>
<script>
export default {
  name: 'SelectList',
  emits: ['input'],
  props: ['multi', 'options', 'name', 'label', 'value', 'required', 'nospaces'],
  data() {
    return {
      model: this.value,
    }
  },
  watch: {
    value(v) { if (v !== this.model) this.model = v },
    model(v) { this.$emit('input', v) },
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
