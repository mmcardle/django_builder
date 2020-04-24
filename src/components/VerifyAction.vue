<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 mr-5">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Verify?</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert :value="error" type="error">
              {{error}}
            </v-alert>
          </v-card-text>
          <v-card-text v-if="!error" class="text-center">
            <v-icon size="90" color="red" class="red--text text--darken-4" spin>mdi-cached mdi-spin</v-icon>
          </v-card-text>
          <v-card-actions v-if="error">
            <v-btn block color="info" v-on:click="verify">Try Again?</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from 'firebase/app'

export default {
  name: 'VerifyAction',
  props: ['oobCode'],
  data: function() {
    return {
      error: undefined
    }
  },
  created: function () {
    this.verify()
  },
  methods: {
    verify: function() {
      this.error = undefined
      firebase.auth().applyActionCode(this.oobCode).then(() => {
        // update emailVerified for logged in User
        if (firebase.auth().currentUser !== null && firebase.auth().currentUser !== undefined) {
          firebase.auth().currentUser.reload().then(() => {
            this.$router.replace({name: 'Home'})
          })
        } else {
          this.$router.replace({name: 'Login'})
        }
      }).catch((error) => {
        this.error = "Sorry there was a problem verifiying your account: " + error.message;
        console.log(error.message, error.reason)
      })
    }
  }
}
</script>

<style scoped>  /* "scoped" attribute limit the CSS to this component only */
  .login {
    margin-top: 40px;
  }
  input {
    margin: 10px 0;
    width: 20%;
    padding: 15px;
  }
  button {
    margin-top: 20px;
    width: 10%;
    cursor: pointer;
  }
  p {
    margin-top: 40px;
    font-size: 13px;
  }
  p a {
    text-decoration: underline;
    cursor: pointer;
  }
</style>
