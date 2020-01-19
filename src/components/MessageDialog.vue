<template>
  <v-dialog v-model="messagedialog" max-width="600">
    <v-card>
      <v-card-title class="primary white--text">
        <span class="white--text headline">
          <font-awesome-icon icon="info-circle" class="white--text" /> {{headline}}
        </span>
      </v-card-title>
      <v-card-text>
        <p>
          <v-alert :value="true" :color="color">{{text}}</v-alert>
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" @click="do_ok">
          Ok
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'MessageDialog',
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
      default: (() => {console.log('messagedialog ok handler')})
    },
    color: {
      type: String,
      default: 'info'
    },
  },
  data: function() {
    return {
      messagedialog: true,
    }
  },
  methods: {
    do_ok: function() {
      this.messagedialog = false
      this.ok()
    }
  }
}
</script>
