<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center" >
      <v-col pa-2 cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Create a new account!</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert :value="error" type="error">
              {{error}}
            </v-alert>
            <v-form>
              <v-text-field prepend-icon="person" name="login" label="Email" type="text" v-model="email"></v-text-field>
              <v-text-field id="password" prepend-icon="lock" name="password" label="Password" type="password" v-model="password"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-3">
            <v-spacer></v-spacer>
            <v-btn color="primary" v-on:click="signUp">Sign Up</v-btn>
          </v-card-actions>
          <v-card-text>
            or if you have an account <router-link :to="{name: 'Login'}">login</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app';

  export default {
    name: 'signUp',
    data: function() {
      return {
        email: '',
        password: '',
        error: undefined
      }
    },
    methods: {
      signUp: function() {
        if (!this.email) {
          this.error = "Please provide a valid email address."
          return
        }
        firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then(
          (user) => {
            this.$router.replace('hello')
            const actionCodeSettings = {url: window.location.origin + '/#/login/'}
            firebase.auth().currentUser.sendEmailVerification(actionCodeSettings).then(() => {
              // Email sent.
              console.log('Email sent to ', user)
            }).catch(function(error) {
              // An error happened.
              console.error('Could not send email sent to ', user, error)
            });
          },
          (error) => {
            this.error = error.message
          }
        );
      }
    }
  }
</script>
