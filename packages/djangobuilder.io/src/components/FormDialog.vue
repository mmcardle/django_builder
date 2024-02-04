<template>
  <v-dialog v-model="formdialog" max-width="600" @keydown.enter="do_ok" v-if="active">
    <v-card>
      <v-card-title class="primary white--text">
        <span class="white--text text-h5">
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
          {{ okText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Vue from 'vue'
import vuetify from '@/plugins/vuetify';
import FormGenerator from '@/components/forms/FormGenerator.vue'

export default {
  name: 'formDialog',
  props: {
    headline: {
      type: String,
      default: 'Complete Form'
    },
    okText: {
      type: String,
      default: 'Submit'
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
      active: true,
      form: undefined,
      formdialog: true,
      icon: 'add',
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
        this.active = false
        this.ok(this.formdata);
        this.$destroy();
      }
    },
    do_cancel: function() {
      this.formdialog = false
      this.active = false
      this.cancel()
      this.$destroy();
    },
  }
}
</script>
