import Vue from 'vue'
import '@firebase/auth'
import '@firebase/firestore'
import firebase from 'firebase/app'

const FirebasePlugin = {}

FirebasePlugin.install = function (Vue) {
  var firestore = firebase.firestore();
  let settings = {};
  if (location.hostname === "localhost") {
    settings = {
      host: "localhost:8080",
      ssl: false
    };
    console.log("Setting up local firestore database at ", settings)
  }
  firestore.settings(settings);
  Vue.prototype.$firestore = firestore
}

let config = {
  apiKey: process.env.VUE_APP_FIREBASE_APIKEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTHDOMAIN,
  databaseURL: process.env.VUE_APP_FIREBASE_DATABASEURL,
  projectId: process.env.VUE_APP_FIREBASE_PROJECTID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGINGSENDERID
}

console.debug("Connecting to", config.authDomain, config)

firebase.initializeApp(config)

Vue.use(FirebasePlugin)
