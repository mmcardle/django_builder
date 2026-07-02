<template>
  <v-app id="django_builder">
    <v-navigation-drawer v-if="user" v-model="drawer"
      app clipped temporary>
      <v-list three-line>
        <v-list-subheader>Switch to Project ...</v-list-subheader>
        <v-list-item :to="{ name: 'Project', params: { id: i } }"
          v-for="(project, i) in mainStore.projects"
          :key="i" class="mb-3">
          <template v-slot:prepend>
            <v-icon class="text-red-darken-4" size="large">mdi-file-tree</v-icon>
          </template>
          <v-list-item-title>
            <h2>{{project.data().name}}</h2>
          </v-list-item-title>
          <v-list-item-title class="text-orange-darken-1">
            <template v-if="project.data().description">
              {{project.data().description}}
            </template>
          </v-list-item-title>
          <v-list-item-subtitle v-if="loaded && verified">
            <div v-for="(d, app) in project.apps" v-bind:key="app" class="mt-2">
              <div v-if="mainStore.appData(app)">
                <div v-for="(d, model) in mainStore.appData(app).models" v-bind:key="app+model" >
                  <v-icon class="text-red-darken-4" >mdi-database</v-icon>
                  {{mainStore.appData(app).name}}.{{mainStore.modelData(model) ? mainStore.modelData(model).name : 'loading'}}
                </div>
              </div>
            </div>
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="user">
          <v-btn size="small" color="primary" @click="showAddProjectDialog">
            <v-icon>mdi-plus</v-icon> New Project
          </v-btn>
        </v-list-item>
      </v-list>
    </v-navigation-drawer >

    <v-app-bar app fixed clipped-left class="d-none d-sm-flex" extension-height="0">
      <v-toolbar-title class="toolbar-title pr-3">
        <router-link :to="{name: 'Splash'}">
          <h2><django-builder-title /></h2>
        </router-link>
      </v-toolbar-title>
      <v-toolbar-items >
        <template v-if="user">
          <v-btn variant="text" :to="{name: 'Home'}">
            <v-icon class="mr-2 text-red-darken-4" size="small">
              mdi-information
            </v-icon>
            Projects
          </v-btn>
          <v-btn variant="text" @click.stop="drawer = !drawer" v-if="loaded && verified && has_projects">
            <v-icon class="text-red-darken-4" style="font-size:2em" size="large">mdi-file-tree</v-icon>
            Switch Project
          </v-btn>
        </template>
        <v-btn variant="text" :to="{name: 'About'}">
          <v-icon class="mr-2 text-red-darken-4">
            mdi-information
          </v-icon>
          About
        </v-btn>
      </v-toolbar-items>
      <v-spacer />
      <v-toolbar-items>
        <template v-if="user">
          <v-btn variant="text">
            <span v-if="user.email" class="text-blue pl-1 pr-1">
              {{user.email}}
            </span>
            <v-avatar :size="40" color="grey-lighten-4" v-if="user.photoURL">
              <img :src="user.photoURL" alt="avatar">
            </v-avatar>
          </v-btn>
          <v-btn variant="text" v-on:click="logout">
            <v-avatar :size="40" color="grey-lighten-4" v-if="user.photoURL">
              <img :src="user.photoURL" alt="avatar">
            </v-avatar>
            <v-icon class="mr-1">mdi-logout</v-icon>
            Sign Out
          </v-btn>
        </template>
        <template v-else>
          <v-spacer></v-spacer>
          <v-btn variant="text" id="navbar_login" :to="{name: 'Login'}" active-class="">
            <v-icon class="mr-1">mdi-login</v-icon>
            Sign In
          </v-btn>
        </template>
      </v-toolbar-items>
    </v-app-bar >

    <v-app-bar app class="d-flex d-sm-none" extension-height="0">
      <!-- Mobile Menu -->
      <v-toolbar-title class="toolbar-title pr-3">
        <router-link :to="{name: 'Home'}">
          <django-builder-title />
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon v-bind="props"></v-app-bar-nav-icon>
        </template>
        <v-card>
          <v-toolbar text>
            <v-toolbar-title><django-builder-title /></v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="dialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>

          <v-list>

            <v-list-item :to="{name: 'Home'}" @click="dialog = false">
              <template v-slot:prepend>
                <v-icon class="text-red-darken-4">mdi-home</v-icon>
              </template>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item>

            <v-list-item :to="{name: 'About'}" @click="dialog = false">
              <template v-slot:prepend>
                <v-icon class="text-red-darken-4">mdi-information</v-icon>
              </template>
              <v-list-item-title>About</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="user" @click="logout">
              <template v-slot:prepend>
                <v-icon class="ml-1">mdi-logout</v-icon>
              </template>
              <v-list-item-title>Sign Out</v-list-item-title>
            </v-list-item>
            <v-list-item v-else :to="{name: 'Login', params: { id: 'main_login'}}" @click="dialog = false">
              <template v-slot:prepend>
                <v-icon class="ml-1">mdi-login</v-icon>
              </template>
              <v-list-item-title>Sign In</v-list-item-title>
            </v-list-item>

          </v-list>
          <v-list density="compact" v-if="user">
            <template v-if="has_projects">
              <v-list-subheader>Switch to Project ...</v-list-subheader>
              <v-list-item :to="{ name: 'Project', params: { id: project.id } }"
                v-for="(project, i) in mainStore.projects" :key="i" class="mb-3" @click="dialog = false">
                <template v-slot:prepend>
                  <v-icon class="text-red-darken-4" style="font-size:2em" size="large">mdi-file-tree</v-icon>
                </template>
                <v-list-item-title>
                  <h2>{{project.name}}</h2>
                </v-list-item-title>
                <v-list-item-title class="text-orange-darken-1">
                  <template v-if="project.description">
                    {{project.description}}
                  </template>
                  <template v-else>
                    ---
                  </template>
                </v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item v-if="user">
              <v-btn color="primary" @click="showAddProjectDialog">
                <v-icon>mdi-plus</v-icon> New Project
              </v-btn>
            </v-list-item>
          </v-list>
        </v-card>
      </v-dialog>
    </v-app-bar>

    <v-main class="pa-0 pt-8 mt-8">
      <v-container fluid class="pa-0">
        <v-alert
          v-if="eol_banner"
          type="warning"
          dense
          class="ma-0 eol-banner pb-2 mb-2"
          @input="dismissEolBanner"
        >
          <div class="d-flex flex-column flex-sm-row align-sm-center">
            <span class="flex-grow-1">
              <strong>Django Builder may be end-of-lifed soon.</strong>
              If you are still using it and would like it to remain online, please
              let us know by opening an issue on GitHub.
            </span>
            <v-btn
              class="ml-sm-4 mt-2 mt-sm-0"
              color="white"
              variant="outlined"
              href="https://github.com/mmcardle/django_builder/issues/new?title=Please+keep+Django+Builder+online"
              target="_blank"
              rel="noopener"
            >
              <v-icon left>mdi-github</v-icon>
              Open an Issue
            </v-btn>
          </div>
        </v-alert>
        <router-view/>
      </v-container>
    </v-main>

    <v-snackbar class="cookie-snackbar d-none d-sm-flex" color="white" v-model="cookie_snackbar" location="bottom right" :timeout="-1">
      <v-switch v-model="cookie_value" color="blue" :label="cookie_label">
        <template v-slot:label>
          <span style="color: blue">{{cookie_label}}</span>
        </template>
      </v-switch>
      <v-dialog v-model="privacy_dialog" width="500">
        <template v-slot:activator="{ props }">
          <v-btn class="bg-primary" v-bind="props">Privacy Policy</v-btn>
        </template>
        <template>
          <v-card dense>
            <v-card-title class="text-h5 bg-grey-lighten-2">
              Privacy Policy
              <v-btn variant="outlined" style="position: absolute; right: 8px" @click="privacy_dialog = false">
                Close
              </v-btn>
            </v-card-title>

            <v-card-title class="text-body-2 pb-1 pt-3">
              What data we collect and how we use it.
            </v-card-title>

            <v-card-text>
              We ask for an email address if you choose to create an account.
              We only use this for the purposes of logging in.
              You can use the <strong>Continue without Account</strong> function
              when logging in if you do not want to do this.
            </v-card-text>

            <v-card-title class="text-body-2 py-1">
              How we use your data
            </v-card-title>

            <v-card-text>
              We don't use your data in any way, except to login and verify your email
              address.
            </v-card-text>

            <v-card-title class="text-body-2 py-1">
              Cookies
            </v-card-title>

            <v-card-text>
              This website uses cookies for basic functionality, these are required
              for the site to function.
            </v-card-text>

            <v-card-text class="text-body-2 py-1">
              Analytics Cookies
            </v-card-text>

            <v-card-text>
              This website uses analytics cookies to help develop and maintain the
              site. you can turn these off and the webstite will still function.
              <v-switch v-model="cookie_value" color="blue" :label="cookie_label"></v-switch>
            </v-card-text>

            <v-card-text class="text-body-2 py-1">
              Contact
            </v-card-text>

            <v-card-text class="">
              If you wish to contact us please see the
              <v-btn variant="outlined" color="info" :to="{name: 'About'}" @click="privacy_dialog = false">About</v-btn> page
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text" @click="privacy_dialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
      <v-btn class="bg-info" @click="agreeAndClose">Agree &amp; Close</v-btn>
    </v-snackbar>

    <v-footer app fixed style="z-index:5">
      <span>&copy; {{year}} Version {{ PACKAGE_VERSION }}</span>
      <v-spacer />
      <v-btn class="d-none d-sm-flex" variant="text" @click.stop="cookie_snackbar = !cookie_snackbar">Privacy Settings</v-btn>
      <v-btn class="d-flex d-sm-none" variant="text" @click.stop="privacy_dialog = true">Privacy Policy</v-btn>
    </v-footer>

  </v-app>
</template>

<style>
.small-caps {
  font-variant: small-caps;
}
.toolbar-title {
  flex: 0 1 auto;
}
.toolbar-title a {
  color: inherit;
  text-decoration: none;
}
.eol-banner {
  border-radius: 0 !important;
}
/* Pin the cookie snackbar flush to the bottom-right corner (Vuetify 3 otherwise
   offsets it above the app footer, unlike the Vuetify 2 original). */
.cookie-snackbar .v-snackbar__wrapper {
  position: fixed !important;
  right: 8px !important;
  bottom: 8px !important;
  margin: 0 !important;
}
</style>

<script>
import { mdiDatabase } from '@mdi/js'

import addProjectMixin from '@/mixins/AddProject'
import {userVerified} from '@/firebase_utils'
import {showConfirmDialog, showUpgradeDialog} from '@/dialogs'

import firebase from 'firebase/compat/app';
import { config } from 'vue-gtag'

const COOKIES_ON = 'Analytics Cookies On'
const COOKIES_OFF = 'Analytics Cookies Off'
const MODE = import.meta.env.MODE
const PROD = import.meta.env.PROD

let PACKAGE_VERSION = import.meta.env.PACKAGE_VERSION
if (!PROD) {
  PACKAGE_VERSION = `${PACKAGE_VERSION} ${MODE}`
}

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
      mdiDatabase: mdiDatabase,
      PACKAGE_VERSION,
      eol_banner: localStorage.eol_banner_dismissed !== 'true',
    }
  },
  computed: {
    loaded: function () {
      return this.mainStore.loaded
    },
    has_projects: function () {
      return this.loaded && Object.keys(this.mainStore.projects).length > 0
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
      config({enabled: this.cookie_value})
      this.cookie_label = this.cookie_value ? COOKIES_ON : COOKIES_OFF
    }
  },
  methods: {
    agreeAndClose: function () {
      this.cookie_snackbar = false
      localStorage.cookie_set_by_user = true
    },
    dismissEolBanner: function (value) {
      if (value === false) {
        localStorage.eol_banner_dismissed = 'true'
      }
    },
    load: function () {
      if (this.user) {
        this.verified = userVerified(firebase.auth().currentUser)
        this.mainStore.load(this.user.uid)
      } else {
        this.verified = false
      }
    },
    doLogout: function () {
      firebase.auth().signOut().then(() => {
        this.mainStore.logout()
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
