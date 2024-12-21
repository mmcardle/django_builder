import Vue from 'vue'

import vuetify from '@/plugins/vuetify';
import '@/plugins/firebase'

import store from './store'
import router from './router'
import firebase from 'firebase/compat/app';

import App from './App.vue'
import VueHighlightJS from 'vue-highlight.js';
import python from 'highlight.js/lib/languages/python';
import django from 'highlight.js/lib/languages/django';
import ini from 'highlight.js/lib/languages/ini';
import DjangoBuilderTitle from '@/components/inc/DjangoBuilderTitle.vue'
import VueGtag from "vue-gtag";

const analytics_disabled = localStorage.cookie_value == 'false'
const VITE_GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID

if (VITE_GOOGLE_ANALYTICS_ID) {
  Vue.use(VueGtag, {
    config: {
      id: VITE_GOOGLE_ANALYTICS_ID,
      enabled: !analytics_disabled
    }
  })
}

let app;

Vue.use(VueHighlightJS, {languages: {python, django, ini}});

Vue.component('django-builder-title', DjangoBuilderTitle)

Vue.config.productionTip = false

firebase.auth().onAuthStateChanged(function() {
  if (!app) {
    app = new Vue({
      vuetify,
      render: h => h(App),
      store,
      router
    }).$mount('#app')
  }
});
