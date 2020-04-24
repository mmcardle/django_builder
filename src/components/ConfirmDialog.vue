<template>
  <v-dialog v-model="confirmdialog" max-width="600">
    <v-card>
      <v-card-title class="primary white--text">
        <span class="white--text headline">
          <v-icon large color="white" class="mr-2">mdi-information</v-icon> {{headline}}
        </span>
      </v-card-title>
      <v-card-text>
        <p class="pt-4">{{text}}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="secondary" @click="do_ok">
          {{ok_text()}}
        </v-btn>
        <v-btn color="darken-1" @click="do_cancel">
          {{cancel_text()}}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'confirmdialog',
  props: {
    headline: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    ok: {
      type: Function,
      default: (() => {console.log('confirmdialog ok handler')})
    },
    cancel: {
      type: Function,
      default: (() => {console.log('confirmdialog cancel handler')})
    },
    options: {
      type: Object,
      default: (() => {return {}})
    }
  },
  data: function() {
    return {
      confirmdialog: true,
    }
  },
  methods: {
    ok_text: function () {
      return this.options.ok_text || 'Ok'
    },
    cancel_text: function () {
      return this.options.cancel_text || 'Cancel'
    },
    do_ok: function() {
      this.confirmdialog = false
      this.ok()
    },
    do_cancel: function() {
      this.confirmdialog = false
      this.cancel()
    }
  }
}
</script>
