<template>
  <v-dialog v-model="messagedialog" max-width="600">
    <v-card>
      <v-card-title class="bg-primary text-white">
        <span class="text-white text-h5">
          <v-icon size="large" color="white" class="mr-2">mdi-information</v-icon> {{headline}}
        </span>
      </v-card-title>
      <v-card-text>
        <p class="pt-4">{{text}}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" @click="do_ok">
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
