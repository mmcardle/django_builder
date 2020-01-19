<template>
  <v-app id="django_builder">
    <v-navigation-drawer v-if="user" v-model="drawer"
      app clipped temporary>
      <v-list three-line>
        <v-subheader>Switch to Project ...</v-subheader>
        <v-list-tile :to="{ name: 'Project', params: { id: project.id } }"
          v-for="(project, i) in this.$store.getters.projects()"
          :key="i" class="mb-3">
          <v-list-tile-action>
            <font-awesome-icon class="red--text text--darken-4" icon="project-diagram" />
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>
              <h2>{{project.data().name}}</h2>
            </v-list-tile-title>
            <v-list-tile-title class="orange--text text--darken-1">
              <template v-if="project.data().description">
                {{project.data().description}}
              </template>
              <template v-else>
                ---
              </template>
            </v-list-tile-title>
            <v-list-tile-sub-title v-if="loaded && verified">
              <template v-for="(d, app) in project.data().apps">
               <template v-for="(d, model) in $store.getters.appData(app).models">
                <font-awesome-icon :key="app + model" class="red--text text--darken-4"
                  icon="database" />
                {{$store.getters.appData(app).name}}.{{$store.getters.modelData(model).name}}
               </template>
              </template>
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile v-if="user">
          <v-list-tile-content>
            <v-btn small color="primary" @click="showAddProjectDialog">
              <v-icon>add</v-icon> New Project
            </v-btn>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer >

    <v-toolbar app fixed clipped-left class="hidden-xs-only" extension-height="0">
      <v-toolbar-title class="toolbar-title pr-3">
        <router-link :to="{name: 'Splash'}">
          <h2><django-builder-title /></h2>
        </router-link>
      </v-toolbar-title>
      <v-toolbar-items >
        <template v-if="user">
          <v-btn flat :to="{name: 'Home'}">
            <v-icon class="mr-2 red--text text--darken-4" small>
              info
            </v-icon>
            Projects
          </v-btn>
          <v-btn flat @click.stop="drawer = !drawer" v-if="loaded && verified">
            <font-awesome-icon style="font-size:1.4em" class="mr-2 red--text text--darken-4"
              icon="project-diagram" />
            Switch Project
          </v-btn>
        </template>
        <v-btn flat :to="{name: 'About'}">
          <v-icon class="mr-2 red--text text--darken-4" small>
            info
          </v-icon>
          About
        </v-btn>
      </v-toolbar-items>
      <v-spacer />
      <v-toolbar-items>
        <template v-if="user">
          <v-btn flat>
            <span v-if="user.email" class="blue--text pl-1 pr-1">
              {{user.email}}
            </span>
            <v-avatar :size="40" color="grey lighten-4" v-if="user.photoURL">
              <img :src="user.photoURL" alt="avatar">
            </v-avatar>
          </v-btn>
          <v-btn flat v-on:click="logout">
            <v-avatar :size="40" color="grey lighten-4" v-if="user.photoURL">
              <img :src="user.photoURL" alt="avatar">
            </v-avatar>
            <font-awesome-icon class="mr-1" icon="sign-out-alt" />
            Sign Out
          </v-btn>
        </template>
        <template v-else>
          <v-spacer></v-spacer>
          <v-btn flat :to="{name: 'Login'}" active-class="">
            <font-awesome-icon class="mr-1" icon="sign-in-alt" />
            Sign In
          </v-btn>
        </template>
      </v-toolbar-items>
    </v-toolbar>

    <v-toolbar app class="hidden-sm-and-up" extension-height="0">
      <!-- Mobile Menu -->
      <v-toolbar-title class="toolbar-title pr-3">
        <router-link :to="{name: 'Home'}">
          <django-builder-title />
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-toolbar-side-icon slot="activator"></v-toolbar-side-icon>
        <v-card>
          <v-toolbar flat>
            <v-toolbar-title><django-builder-title /></v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click.native="dialog = false">
              <v-icon>close</v-icon>
            </v-btn>
          </v-toolbar>

          <v-list>

            <v-list-tile :to="{name: 'Home'}" @click="dialog = false">
              <v-list-tile-action>
                <v-icon class="red--text text--darken-4">home</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Home</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile :to="{name: 'About'}" @click="dialog = false">
              <v-list-tile-action>
                <v-icon class="red--text text--darken-4">info</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>About</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile v-if="user" @click="logout">
              <v-list-tile-action>
                <font-awesome-icon class="ml-1" icon="sign-out-alt" />
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Sign Out</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile v-else :to="{name: 'Login'}" @click="dialog = false">
              <v-list-tile-action>
                <font-awesome-icon class="ml-1" icon="sign-in-alt" />
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Sign In</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

          </v-list>
          <v-list dense two-line v-if="user">
            <v-subheader>Switch to Project ...</v-subheader>
              <v-list-tile :to="{ name: 'Project', params: { id: project.id } }"
                v-for="(project, i) in this.$store.getters.projects()"
                :key="i" class="mb-3" @click="dialog = false">
                <v-list-tile-action>
                  <font-awesome-icon class="red--text text--darken-4" icon="project-diagram" />
                </v-list-tile-action>
                <v-list-tile-content>
                  <v-list-tile-title>
                    <h2>{{project.data().name}}</h2>
                  </v-list-tile-title>
                  <v-list-tile-title class="orange--text text--darken-1">
                    <template v-if="project.data().description">
                      {{project.data().description}}
                    </template>
                    <template v-else>
                      ---
                    </template>
                  </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile v-if="user">
              <v-list-tile-content>
                <v-btn small round @click="showAddProjectDialog">
                  <v-icon>add</v-icon> New Project
                </v-btn>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-dialog>
    </v-toolbar>

    <v-content>
      <v-container fluid class="px-0">
        <router-view/>
      </v-container>
    </v-content>

    <v-dialog v-model="privacy_dialog" width="500">
      <v-card dense>
        <v-card-title class="headline grey lighten-2" primary-title>
          Privacy Policy
          <v-btn outline absolute right flat @click="privacy_dialog = false">
            Close
          </v-btn>
        </v-card-title>

        <v-card-title class="body-2 pb-1 pt-3" primary-title>
          What data we collect and how we use it.
        </v-card-title>

        <v-card-text>
          We ask for an email address if you choose to create an account.
          We only use this for the purposes of logging in.
          You can use the <strong>Continue without Account</strong> function
          when logging in if you do not want to do this.
        </v-card-text>

        <v-card-title class="body-2 py-1" primary-title>
          How we use your data
        </v-card-title>

        <v-card-text>
          We don't use your data in any way, except to login and verify your email
          address.
        </v-card-text>

        <v-card-title class="body-2 py-1" primary-title>
          Cookies
        </v-card-title>

        <v-card-text>
          This website uses cookies for basic functionality, these are required
          for the site to function.
        </v-card-text>

        <v-card-text class="body-2 py-1" primary-title>
          Analytics Cookies
        </v-card-text>

        <v-card-text>
          This website uses analytics cookies to help develop and maintain the
          site. you can turn these off and the webstite will still function.
          <v-switch v-model="cookie_value" color="blue" :label="cookie_label"></v-switch>
        </v-card-text>

        <v-card-text class="body-2 py-1" primary-title>
          Contact
        </v-card-text>

        <v-card-text class="">
          If you wish to contact us please see the
          <v-btn outline color="info" :to="{name: 'About'}" @click="privacy_dialog = false">About</v-btn> page
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" flat @click="privacy_dialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar class="hidden-xs-only" color="white" v-model="cookie_snackbar" bottom right :timeout="0">
      <v-switch v-model="cookie_value" color="blue" :label="cookie_label"></v-switch>
      <v-btn class="primary" @click="privacy_dialog = true">Privacy Policy</v-btn>
      <v-btn class="info" @click="agreeAndClose">Agree &amp; Close</v-btn>
    </v-snackbar>

    <v-footer app fixed>
      <span>&copy; {{year}}</span>
      <v-spacer />
      <v-btn class="hidden-xs-only" flat @click.stop="cookie_snackbar = !cookie_snackbar">Privacy Settings</v-btn>
      <v-btn class="hidden-sm-and-up" flat @click.stop="privacy_dialog = true">Privacy Policy</v-btn>
    </v-footer>

  </v-app>
</template>

<style>
.small-caps {
  font-variant: small-caps;
}
.toolbar-title a {
  color: inherit;
  text-decoration: none;
}
</style>

<script>

import addProjectMixin from '@/mixins/AddProject'
import {userVerified} from '@/firebase_utils/'
import {showConfirmDialog, showUpgradeDialog} from '@/dialogs/'

import firebase from 'firebase/app';

const COOKIES_ON = 'Analytics Cookies On'
const COOKIES_OFF = 'Analytics Cookies Off'

export default {
  mixins: [addProjectMixin],
  data () {
    return {
      privacy_dialog: false,
      cookie_snackbar: localStorage.cookie_set_by_user ? false : true,
      cookie_label: localStorage.cookie_value == 'true' ? COOKIES_ON : COOKIES_OFF,
      cookie_value: true,
      drawer: null,
      user: null,
      verified: false,
      dialog: false
    }
  },
  computed: {
    loaded: function () {
      return this.$store.getters.loaded()
    },
    year: () => {return new Date().getFullYear()}
  },
  created: function () {
    //console.log('localStorage.cookie_set_by_user', this.cookie_snackbar, localStorage.cookie_set_by_user)
    this.user = firebase.auth().currentUser ? firebase.auth().currentUser : null
    this.cookie_value = localStorage.cookie_value == undefined ? true: localStorage.cookie_value == 'true' ? true : false
    this.cookie_label = this.cookie_value ? COOKIES_ON : COOKIES_OFF
    firebase.auth().onAuthStateChanged((user) => {
      this.user = user
      this.load()
    })
  },
  watch: {
    user: function () {
      this.load()
    },
    cookie_value: function () {
      localStorage.cookie_set_by_user = true
      localStorage.cookie_value = this.cookie_value
      this.cookie_value ? this.$ga.enable() : this.$ga.disable()
      this.cookie_label = this.cookie_value ? COOKIES_ON : COOKIES_OFF
    }
  },
  methods: {
    agreeAndClose: function () {
      this.cookie_snackbar = false
      localStorage.cookie_set_by_user = true
    },
    load: function () {
      if (this.user) {
        this.verified = userVerified(firebase.auth().currentUser)
        this.$store.dispatch('load', this.user.uid)
      } else {
        this.verified = false
      }
    },
    doLogout: function () {
      firebase.auth().signOut().then(() => {
        this.$store.commit('logout')
        this.$router.replace('/')
        this.dialog = false
        this.user = undefined
      })
    },
    upgrade: function (email, password) {
      const router = this.$router
      return new Promise((resolve, reject) => {
        var credential = firebase.auth.EmailAuthProvider.credential(email, password)
        // Links the credential to the currently signed in user
        // (the anonymous user).
        firebase.auth().currentUser.linkAndRetrieveDataWithCredential(credential).then(function(user) {
          console.log("Anonymous account successfully upgraded", user)
          router.replace('/')
          resolve(user)
        }, function(error) {
          console.log("Error upgrading anonymous account", error)
          reject(error)
        })
      })
    },
    doAnonymousLogout: function () {
      this.$router.replace('/')

      const db = this.$firestore
      const doLogout = this.doLogout

      // Deleting all elements in all collections, in a batch write
      var batch = db.batch();
      const collections = ["projects", "apps", "models", "fields", "relationships"]
      const promises = collections.map(col => {
        return new Promise((resolve) => {
          db.collection(col).where(
            "owner", "==", this.user.uid
          ).get().then((data) => {
            resolve(data)
          })
        })
      })

      return Promise.all(promises).then((results) => {
        results.forEach(data => {
          data.docs.forEach(doc => {
            batch.delete(doc.ref)
          })
        })
        batch.commit().then(doLogout)
      }).catch(error => {
        console.log(error)
        doLogout()
      })
    },
    logout: function () {
      if (this.user.isAnonymous) {
        showUpgradeDialog(
          this.upgrade,
          this.doAnonymousLogout,
          () => {}
        )
      } else {
        showConfirmDialog(
          "Confirm Logout",
          "Thank you for user Django Builder!",
          this.doLogout,
          () => {},
          {
            ok_text: 'Logout'
          }
        )

      }
    },
  },
  props: {
    source: String
  }
}
</script>
