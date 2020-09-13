<template>
  <v-dialog v-model="formdialog" max-width="600" @keydown.enter="do_ok">
    <v-card>
      <v-card-title class="primary white--text">
        <span class="white--text headline">
          <v-icon style="font-size:1.2em" color="white">{{icon}}</v-icon> {{headline}}
        </span>
      </v-card-title>
      <v-card-text class="pt-3 text-center" v-if="extra">
        <v-btn small ripple color="success" type="file" style="width:50%"
          @click="extra_callback()">
          <v-icon class=mr-1 color=white>mdi-cloud-upload</v-icon> {{extra_name()}}
        </v-btn>
      </v-card-text>
      <v-card-text class="pt-3">
        <div ref="formcontainer"></div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" text @click="do_cancel">
          Cancel
        </v-btn>
        <v-btn @click="do_ok">
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Vue from 'vue'
import vuetify from '@/plugins/vuetify';
import FormGenerator from '@/components/forms/FormGenerator'

export default {
  name: 'formDialog',
  props: {
    headline: {
      type: String,
      default: 'Complete Form'
    },
    schema: {
      type: Array,
      default: (() => [])
    },
    extra: {
      type: Object,
      default: undefined
    },
    formdata: {
      type: Object,
      default: (() => {})
    },
    icon: {
      type: String,
      default: 'add'
    },
    ok: {
      type: Function,
      default: (() => {console.debug('FormDialog ok handler')})
    },
    cancel: {
      type: Function,
      default: (() => {console.debug('FormDialog cancel handler')})
    }
  },
  created: function () {
    this.icon = Object.keys(this.formdata).length === 0 ? 'add' : 'edit'
  },
  data: function() {
    return {
      form: undefined,
      formdialog: true
    }
  },
  mounted: function () {
    const FormGeneratorClass = Vue.extend(FormGenerator)
    this.form = new FormGeneratorClass({
      vuetify, propsData: {schema: this.schema, value: this.formdata}
    })
    this.$refs.formcontainer.appendChild(this.form.$mount().$el)
  },
  methods: {
    extra_name() {
      return this.extra.name;
    },
    extra_callback() {
      this.do_cancel()
      this.extra.callback();
    },
    do_ok: function() {
      if (this.form.$refs.form.validate()) {
        this.formdialog = false
        this.ok(this.formdata)
      }
    },
    do_cancel: function() {
      this.formdialog = false
      this.cancel()
    },
  }
}
</script>
