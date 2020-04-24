import Vue from 'vue'

import vuetify from './plugins/vuetify';
import './plugins/firebase'

import store from './store'
import router from './router'
import firebase from 'firebase/app'

import App from './App.vue'
import VueHighlightJS from 'vue-highlight.js';
import python from 'highlight.js/lib/languages/python';
import django from 'highlight.js/lib/languages/django';
import ini from 'highlight.js/lib/languages/ini';
import VueDragDrop from 'vue-drag-drop'
import DjangoBuilderTitle from '@/components/inc/DjangoBuilderTitle'

let app;

Vue.use(VueDragDrop)

Vue.use(VueHighlightJS, {languages: {python, django, ini}});

Vue.component('django-builder-title', DjangoBuilderTitle)

Vue.config.productionTip = false

firebase.auth().onAuthStateChanged(function(_user) {
  if (!app) {
    app = new Vue({
      vuetify,
      render: h => h(App),
      store,
      router
    }).$mount('#app')
  }
});
