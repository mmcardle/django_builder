<template>
  <div>
    <v-form ref="form" v-model="valid">
      <component v-for="(field, index) in schema"
                 :key="index" :ref="field.name"
                 :autofocus="index===0"
                 :is="field.fieldType"
                 :value="formData[field.name]"
                 @input="updateForm(field.name, $event)"
                 v-bind="field">
      </component>
    </v-form>
  </div>
</template>

<script>
// from https://codesandbox.io/s/0p9n4y5kyw
import SelectList from "./SelectList";
import SelectListObjects from "./SelectListObjects";
import ButtonGroupSelect from "./ButtonGroupSelect";
import TextInput from "./TextInput";
import BooleanInput from "./BooleanInput";

export default {
  name: "FormGenerator",
  components: { SelectList, TextInput, BooleanInput, SelectListObjects, ButtonGroupSelect },
  props: ["schema", "value"],
  data() {
    return {
      valid: true,
      formData: this.value || {}
    };
  },
  methods: {
    updateForm(fieldName, value) {
      this.schema.forEach((fieldSchema) => {
        if (fieldSchema.updated){
          const updatedData = fieldSchema.updated(this.$refs, fieldName, value)
          if (updatedData) {
            this.$set(this.formData, updatedData.field, updatedData.value)
            this.$emit("input", this.formData)
          }
        }
      })
      this.$set(this.formData, fieldName, value)
      this.$emit("input", this.formData)
    }
  }
};
</script>
