<template>
  <div>
    <v-text-field
      :value="default_value" :rules="rules" :required="required"
      :label="label" :placeholder="placeholder"
      :default="default_value" @input="$emit('input', $event);">
      >
    </v-text-field>
  </div>
</template>
<script>
export default {
  name: 'TextInput',
  props: [
    'placeholder', 'label', 'name', 'value', 'required',
    'max', 'nospaces'
  ],
  data() {
    return {
      default_value: this.value,
    }
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
