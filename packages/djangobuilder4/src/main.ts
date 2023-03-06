import { createApp } from "vue";
import { createPinia } from "pinia";

import "./firebase";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { useUserStore } from "./stores/user";

import { getAuth, onAuthStateChanged } from "firebase/auth";

import "highlight.js/styles/stackoverflow-light.css";
import hljs from "highlight.js/lib/core";
import django from "highlight.js/lib/languages/django";
import python from "highlight.js/lib/languages/python";
import ini from "highlight.js/lib/languages/ini";
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage("python", python);
hljs.registerLanguage("django", django);
hljs.registerLanguage("ini", ini);

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  console.debug("User", user);
  const app = createApp(App);
  app.use(createPinia());
  app.use(hljsVuePlugin);
  app.use(router);
  app.mount("#app");
  const userStore = useUserStore();
  if (user) {
    userStore.loginUser(user);
    router.push({ name: "projects" });
  } else {
    userStore.logoutUser();
    router.push({ name: "login" });
  }
});
