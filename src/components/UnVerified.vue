<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6" xl="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Verify Email</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert :value="success" type="info" v-if="success">
              {{success}}
            </v-alert>
            <v-alert :value="error" type="error" v-if="error">
              {{error}}
            </v-alert>
          </v-card-text>
          <v-card-text class="text-center body-2">
            Email address has not been verified.
            Please check your email and click the link to verify your account.
          </v-card-text>
          <v-card-actions v-if="!success">
            <v-btn block color="info" v-on:click="resendVerification">Resend Verification Email</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'

  export default {
    name: 'login',
    data: function() {
      return {
        success: undefined,
        error: undefined
      }
    },
    methods: {
      resendVerification: function() {
        this.success = undefined
        this.error = undefined
        const user = firebase.auth().currentUser
        const actionCodeSettings = {url: window.location.origin + '/#/login/'}
        user.sendEmailVerification(actionCodeSettings).then(() => {
          // Email sent.
          console.log('Email sent to ', user)
          this.success = "An email has been sent to your address. Please click " +
            "on the link in the email to verify your account"
        }).catch((error) => {
          console.error('Could not send email sent to ', error)
          if (error.code === "auth/too-many-requests") {
            this.error = "Sorry too many attempts to send email, please try later."
          } else {
            this.error = "Sorry we had issues sending your verification email, please try later."
          }
        });
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
