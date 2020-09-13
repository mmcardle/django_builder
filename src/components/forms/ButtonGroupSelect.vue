<template>
  <div>
    <strong class="mr-3">{{label}}</strong>
    <v-btn-toggle borderless v-model="selected_value">
      <v-btn
        v-bind:key="item.value" :value="item.value" v-for="item in options" @click="setValue(item.value)"
      >
        {{item.text}}
      </v-btn>
    </v-btn-toggle>
  </div>
</template>
<script>
export default {
  name: 'ButtonGroupSelect',
  props: ['options', 'name', 'label', 'value', 'required', 'default_value'],
  data () {
    return {
      selected_value: this.value || this.default_value,
    }
  },
  methods: {
    setValue(v) {
      this.selected_value = v
      this.$emit("input", v);
    },
  },
}
</script>
