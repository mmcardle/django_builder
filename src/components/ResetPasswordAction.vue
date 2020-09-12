<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center" >
      <v-col pa-2 cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Reset your password!</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert :value="error" type="error" class="my-3">
              {{error}}
            </v-alert>
            <v-form>
              <v-text-field prepend-icon="person" name="login" label="Email" type="email" v-model="email" autocomplete="email"
                disabled>
              </v-text-field>
              <v-text-field id="password" autocomplete="new-password" prepend-icon="lock" name="password"
                label="Password" type="password" v-model="password" :error="errors.password !== undefined">
              </v-text-field>
              <v-text-field id="password2"  prepend-icon="lock" name="password2"
                label="Verify Password" autocomplete="new-password" type="password" v-model="password2"
                :error="errors.password2 !== undefined"
               ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-3">
            <div v-if="invalid">You can try again to <router-link :to="{name: 'ResetPassword'}">reset your password</router-link></div>
            <v-spacer></v-spacer>
            <v-btn color="primary" v-on:click="resetPassword" :disabled="invalid">Reset</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from 'firebase/app'
import {showMessageDialog} from '@/dialogs/'

export default {
  name: 'ResetPasswordAction',
  props: ['oobCode'],
  data: function() {
    return {
      email: undefined,
      password: undefined,
      password2: undefined,
      error: undefined,
      invalid: undefined,
      errors: {
        email: undefined,
        password: undefined,
        password2: undefined,
      },
    }
  },
  created: function () {
    // Pre check code
    firebase.auth().checkActionCode(this.oobCode).then((result) => {
      // Code is valid
      this.email = result.data.email
    }).catch(error => {
      this.error = error.message
      this.invalid = true
    })
  },
  methods: {
    resetPassword: function() {
      this.error = undefined
      this.errors = {
        password: undefined,
        password2: undefined,
      }
      if (!this.password) {
        this.errors.password = true
        this.error = "Please provide a new password."
        return
      }
      if (!this.password2) {
        this.errors.password2 = true
        this.error = "Please enter your password a second time."
        return
      }
      if (this.password !== this.password2) {
        this.errors.password2 = true
        this.error = "Those passwords do not match."
        return
      }

      firebase.auth().confirmPasswordReset(this.oobCode, this.password).then(
        () => {
          showMessageDialog(
            "Password Reset",
            "Your password has been reset",
            () => {},
          )
          this.$router.push({name: 'Login'})
        },
        (error) => {
          this.error = error.message
        }
      )
    }
  }
}
</script>
