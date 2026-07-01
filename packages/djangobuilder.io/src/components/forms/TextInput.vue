<template>
  <v-text-field
    v-model="model" :rules="rules" :required="required"
    :label="label" :placeholder="placeholder" :autofocus="autofocus">
  </v-text-field>
</template>
<script>
export default {
  name: 'TextInput',
  emits: ['input'],
  props: [
    'placeholder', 'label', 'name', 'value', 'required',
    'max', 'nospaces', 'autofocus'
  ],
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
        const rule =
          v => (v || '').length <= this.max ||
            `A maximum of ${this.max} characters is allowed`

        rules.push(rule)
      }

      if (this.nospaces) {
        const rule =
          v => (v || '').indexOf(' ') < 0 ||
            'No spaces are allowed'

        rules.push(rule)
      }

      return rules
    }
  },
}
</script>
