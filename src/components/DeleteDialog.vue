<template>
  <v-dialog v-model="deletedialog" max-width="600">
    <v-card>
      <v-card-title class="primary white--text">
        <span class="white--text headline">
          <v-icon class="white--text" large>mdi-delete</v-icon> {{headline}}
        </span>
      </v-card-title>
      <v-card-text class="pt-5">
          {{text}}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" text @click="do_cancel">
          Cancel
        </v-btn>
        <v-btn color="error darken-1" @click="do_ok">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'deleteDialog',
  props: {
    headline: {
      type: String,
      default: 'Delete?'
    },
    text: {
      type: String,
      default: 'Are you sure you wish to delete?'
    },
    ok: {
      type: Function
    },
    cancel: {
      type: Function
    },
  },
  data: function() {
    return {
      deletedialog: true,
    }
  },
  methods: {
    do_ok: function() {
      this.deletedialog = false
      this.ok()
    },
    do_cancel: function() {
      this.deletedialog = false
      this.cancel()
    }
  }
}
</script>
