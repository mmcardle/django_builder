<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center" >
      <v-col pa-2 cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Reset your password!</v-toolbar-title>
          </v-toolbar>
          <template v-if="!reset">
            <v-card-text>
              <v-alert :value="error" type="error" class="my-3">
                {{error}}
              </v-alert>
              <v-form>
                <v-text-field prepend-icon="person" name="login" label="Email" type="text" v-model="email" autocomplete="email">
                </v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions class="px-3">
              <v-spacer></v-spacer>
              <v-btn color="primary" v-on:click="resetPassword">Reset</v-btn>
            </v-card-actions>
          </template>
          <template v-else>
            <v-card-text class="pa-4">
              A password reset email has been sent to your email address.
              Once you reset your password you can <router-link :to="{name: 'Login'}">login</router-link>
            </v-card-text>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from 'firebase/app';

export default {
  name: 'ResetPassword',
  data: function() {
    return {
      reset: false,
      email: undefined,
      error: undefined,
      errors: {
        email: undefined,
      },
    }
  },
  methods: {
    resetPassword: function() {
      if (!this.email) {
        this.errors.email = true
        this.error = "Please provide your email."
        return
      }
      firebase.auth().sendPasswordResetEmail(this.email).then(() => {
        this.reset = true
      }).catch(error => {
        console.log(error)
        this.reset = true
      });
    }
  }
}
</script>
