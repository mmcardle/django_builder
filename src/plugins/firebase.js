import Vue from 'vue'
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import firebase from 'firebase/compat/app';

const FirebasePlugin = {}

FirebasePlugin.install = function (Vue) {
  var firestore = firebase.firestore();
  let settings = {merge: true};
  if (location.hostname === "localhost") {
    /*settings = {
      host: "localhost:8080",
      ssl: false
    };
    console.log("Setting up local firestore database at ", settings)
    */
  }
  console.log("Setting up firestore database at ", settings)
  firestore.settings(settings);
  Vue.prototype.$firestore = firestore
}

let config = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASEURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID
}

console.debug("Connecting to", config.authDomain, config)

firebase.initializeApp(config)
console.log("firebase.initializeApp", config)
Vue.use(FirebasePlugin)
