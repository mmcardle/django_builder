import { createApp } from 'vue'
import { createPinia } from 'pinia'

import vuetify from '@/plugins/vuetify';
import FirebasePlugin from '@/plugins/firebase'

import router from './router'
import firebase from 'firebase/compat/app';

import App from './App.vue'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python';
import django from 'highlight.js/lib/languages/django';
import ini from 'highlight.js/lib/languages/ini';
import DjangoBuilderTitle from '@/components/inc/DjangoBuilderTitle.vue'
import { createGtag } from "vue-gtag";

hljs.registerLanguage('python', python);
hljs.registerLanguage('django', django);
hljs.registerLanguage('ini', ini);

const analytics_disabled = localStorage.cookie_value == 'false'
const VITE_GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID

let app;

firebase.auth().onAuthStateChanged(function() {
  if (!app) {
    app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.use(vuetify)
    app.use(FirebasePlugin)
    app.use(hljsVuePlugin)
    app.component('django-builder-title', DjangoBuilderTitle)

    if (VITE_GOOGLE_ANALYTICS_ID) {
      app.use(createGtag({
        config: {
          id: VITE_GOOGLE_ANALYTICS_ID,
          enabled: !analytics_disabled
        }
      }))
    }

    app.mount('#app')
  }
});
