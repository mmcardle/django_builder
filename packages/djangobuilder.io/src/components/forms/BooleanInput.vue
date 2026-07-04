<template>
  <div>
     <v-switch v-model="model" :label="label" color="primary"></v-switch>
  </div>
</template>
<script>
export default {
  name: 'BooleanInput',
  emits: ['input'],
  data() {
    return {
      model: this.value ?? false,
    }
  },
  props: [
    'label', 'name', 'value', 'required'
  ],
  watch: {
    value(v) { if (v !== this.model) this.model = v },
    model(v) { this.$emit('input', v) },
  },
}
</script>
