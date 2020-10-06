<template>
  <v-app id="django_builder">
    <v-navigation-drawer v-if="user" v-model="drawer"
      app clipped temporary>
      <v-list three-line>
        <v-subheader>Switch to Project ...</v-subheader>
        <v-list-item :to="{ name: 'Project', params: { id: project.id } }"
          v-for="(project, i) in this.$store.getters.projects()"
          :key="i" class="mb-3">
          <v-list-item-action>
            <v-icon class="red--text text--darken-4" large>mdi-file-tree</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              <h2>{{project.data().name}}</h2>
            </v-list-item-title>
            <v-list-item-title class="orange--text text--darken-1">
              <template v-if="project.data().description">
                {{project.data().description}}
              </template>
            </v-list-item-title>
            <v-list-item-subtitle v-if="loaded && verified">
              <div v-for="(d, app) in project.data().apps" v-bind:key="app" class="mt-2">
                <div v-if="$store.getters.appData(app)">
                  <div v-for="(d, model) in $store.getters.appData(app).models" v-bind:key="app+model" >
                    <v-icon class="red--text text--darken-4" >mdi-database</v-icon>
                    {{$store.getters.appData(app).name}}.{{$store.getters.modelData(model) ? $store.getters.modelData(model).name : 'loading'}}
                  </div>
                </div>
              </div>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="user">
          <v-list-item-content>
            <v-btn small color="primary" @click="showAddProjectDialog">
              <v-icon>add</v-icon> New Project
            </v-btn>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer >

    <v-app-bar app fixed clipped-left class="hidden-xs-only" extension-height="0">
      <v-toolbar-title class="toolbar-title pr-3">
        <router-link :to="{name: 'Splash'}">
          <h2><django-builder-title /></h2>
        </router-link>
      </v-toolbar-title>
      <v-toolbar-items >
        <template v-if="user">
          <v-btn text :to="{name: 'Home'}">
            <v-icon class="mr-2 red--text text--darken-4" small>
              info
            </v-icon>
            Projects
          </v-btn>
          <v-btn text @click.stop="drawer = !drawer" v-if="loaded && verified && has_projects">
            <v-icon class="red--text text--darken-4" style="font-size:2em" large>mdi-file-tree</v-icon>
            Switch Project
          </v-btn>
        </template>
        <v-btn text :to="{name: 'About'}">
          <v-icon class="mr-2 red--text text--darken-4">
            mdi-information
          </v-icon>
          About
        </v-btn>
      </v-toolbar-items>
      <v-spacer />
      <v-toolbar-items>
        <template v-if="user">
          <v-btn text>
            <span v-if="user.email" class="blue--text pl-1 pr-1">
              {{user.email}}
            </span>
            <v-avatar :size="40" color="grey lighten-4" v-if="user.photoURL">
              <img :src="user.photoURL" alt="avatar">
            </v-avatar>
          </v-btn>
          <v-btn text v-on:click="logout">
            <v-avatar :size="40" color="grey lighten-4" v-if="user.photoURL">
              <img :src="user.photoURL" alt="avatar">
            </v-avatar>
            <v-icon class="mr-1">mdi-logout</v-icon>
            Sign Out
          </v-btn>
        </template>
        <template v-else>
          <v-spacer></v-spacer>
          <v-btn text :to="{name: 'Login'}" active-class="">
            <v-icon class="mr-1">mdi-login</v-icon>
            Sign In
          </v-btn>
        </template>
      </v-toolbar-items>
    </v-app-bar >

    <v-app-bar app class="hidden-sm-and-up" extension-height="0">
      <!-- Mobile Menu -->
      <v-toolbar-title class="toolbar-title pr-3">
        <router-link :to="{name: 'Home'}">
          <django-builder-title />
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <template v-slot:activator="{ on }">
          <v-app-bar-nav-icon v-on="on"></v-app-bar-nav-icon>
        </template>
        <v-card>
          <v-toolbar text>
            <v-toolbar-title><django-builder-title /></v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click.native="dialog = false">
              <v-icon>close</v-icon>
            </v-btn>
          </v-toolbar>

          <v-list>

            <v-list-item :to="{name: 'Home'}" @click="dialog = false">
              <v-list-item-action>
                <v-icon class="red--text text--darken-4">home</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Home</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :to="{name: 'About'}" @click="dialog = false">
              <v-list-item-action>
                <v-icon class="red--text text--darken-4">info</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>About</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="user" @click="logout">
              <v-list-item-action>
                <v-icon class="ml-1">mdi-logout</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Sign Out</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-else :to="{name: 'Login'}" @click="dialog = false">
              <v-list-item-action>
                <v-icon class="ml-1">mdi-login</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Sign In</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

          </v-list>
          <v-list dense two-line v-if="user">
            <template v-if="has_projects">
              <v-subheader>Switch to Project ...</v-subheader>
              <v-list-item :to="{ name: 'Project', params: { id: project.id } }"
                v-for="(project, i) in $store.getters.projects()" :key="i" class="mb-3" @click="dialog = false">
                <v-list-item-action>
                  <v-icon class="red--text text--darken-4" style="font-size:2em" large>mdi-file-tree</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title>
                    <h2>{{project.data().name}}</h2>
                  </v-list-item-title>
                  <v-list-item-title class="orange--text text--darken-1">
                    <template v-if="project.data().description">
                      {{project.data().description}}
                    </template>
                    <template v-else>
                      ---
                    </template>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
            <v-list-item v-if="user">
              <v-list-item-content>
                <v-btn color="primary" @click="showAddProjectDialog">
                  <v-icon>add</v-icon> New Project
                </v-btn>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-dialog>
    </v-app-bar>

    <v-content>
      <v-container fluid class="pa-0">
        <router-view/>
      </v-container>
    </v-content>

    <v-snackbar class="hidden-xs-only" color="white" v-model="cookie_snackbar" bottom right :timeout="0">
      <v-switch v-model="cookie_value" color="blue" :label="cookie_label"></v-switch>
      <v-dialog v-model="privacy_dialog" width="500">
        <template v-slot:activator="{ on }">
          <v-btn class="primary" v-on="on">Privacy Policy</v-btn>
        </template>
        <template>
          <v-card dense>
            <v-card-title class="headline grey lighten-2" primary-title>
              Privacy Policy
              <v-btn outlined absolute right text @click="privacy_dialog = false">
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
              <v-btn outlined color="info" :to="{name: 'About'}" @click="privacy_dialog = false">About</v-btn> page
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="privacy_dialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
      <v-btn class="info" @click="agreeAndClose">Agree &amp; Close</v-btn>
    </v-snackbar>

    <v-footer app fixed style="z-index:5">
      <span>&copy; {{year}}</span>
      <v-spacer />
      <v-btn class="hidden-xs-only" text @click.stop="cookie_snackbar = !cookie_snackbar">Privacy Settings</v-btn>
      <v-btn class="hidden-sm-and-up" text @click.stop="privacy_dialog = true">Privacy Policy</v-btn>
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
import { mdiDatabase } from '@mdi/js'

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
      dialog: false,
      mdiDatabase: mdiDatabase
    }
  },
  computed: {
    loaded: function () {
      return this.$store.getters.loaded()
    },
    has_projects: function () {
      return this.loaded && this.$store.getters.projects() && Object.keys(this.$store.getters.projects()).length > 0
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
