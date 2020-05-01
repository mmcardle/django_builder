<template>
  <v-container fluid fill-height>
    <v-row align-top justify="center" >
      <v-col pa-2 cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12" height="100%">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Sign in</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert v-if="error" type="error" class="my-3">
              {{error}}
            </v-alert>
            <v-form>
              <v-text-field prepend-icon="person" name="login" label="Login" type="text" v-model="email" :error="email_error"></v-text-field>
              <v-text-field id="password" prepend-icon="lock" name="password" label="Password" type="password" v-model="password"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-3">
            <v-spacer></v-spacer>
            <v-btn color="primary" v-on:click="signIn">Login</v-btn>
          </v-card-actions>
          <v-card-text>
            <div class="mb-2">You don't have an account ? You can <router-link :to="{name: 'SignUp'}">create one</router-link></div>
            <div>Have you forgotten your password ? You can <router-link :to="{name: 'ResetPassword'}">reset your password</router-link></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col pa-2 cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12" height="100%">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Sign In Anonymously</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="text-center mt-3">
            Continue without an account and stay anonymous.
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <v-btn width="200" large v-on:click="signInAnonymously">
              <v-icon class="mr-2">mdi-account-circle</v-icon> Continue
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center font-italic bold">
            Note: You can always create a user account later.
          </v-card-text>
        </v-card>
        <!--
        Removing github login for pre launch
        <v-card pa-2 class="elevation-12 mt-2">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Login with github</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="text-xs-center">
            This will authenticate you using your github account.
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <v-btn color="default" v-on:click="signInWithGithub" class="mr-4">
               Continue
            </v-btn>
            <v-icon class="red--text text-darken-3" >mdi-github-circle</v-icon>
          </v-card-actions>
        </v-card-->
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
        email: '',
        email_error: false,
        password: '',
        error: undefined
      }
    },
    methods: {
      signIn: function() {
        this.email_error = false
        firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(
          (userData) => {
            if (userData.user.emailVerified){
              this.$router.replace({name: 'Home'})
            } else {
              this.$router.replace({name: 'UnVerified'})
            }
            this.$store.dispatch('load', userData.user.uid)
          },
          (err) => {
            console.log(err)
            if (err.code === 'auth/user-not-found') {
              this.error = 'Sorry there is no user with that username and password.'
            } else if (err.code === 'auth/invalid-email') {
              this.error = 'That is not a valid email.'
              this.email_error = true
            } else {
              this.error = 'Sorry there was a problem when logging you in.'
            }
          }
        );
      },
      signInAnonymously: function () {
        firebase.auth().signInAnonymously().then((userData) => {
          console.log('signInAnonymously', userData)
          this.$router.replace('home')
          this.$store.dispatch('load', userData.user.uid)
        }).catch(function(error) {
          // Handle Errors here.
          var _errorCode = error.code;
          var _errorMessage = error.message;
          console.log('signInAnonymously error', error)
          // ...
        });
      },
      signInWithGithub: function () {
        var provider = new firebase.auth.GithubAuthProvider();
        firebase.auth().signInWithPopup(provider).then((userData) => {
          // This gives you a GitHub Access Token. You can use it to access the GitHub API.
          var _unused = userData.credential.accessToken;
          // The signed-in user info.
          var _user = userData.user;
          // ...
          console.log('signInWithGithub', userData)
          this.$router.replace('home')
          this.$store.dispatch('load', userData.user.uid)
        }).catch(function(error) {
          // Handle Errors here.
          var _errorCode = error.code;
          var _errorMessage = error.message;
          // The email of the user's account used.
          var _email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var _credential = error.credential;
          // ...
          console.log('signInWithGithub error', error)
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
