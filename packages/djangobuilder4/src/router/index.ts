import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";

import { auth } from "../firebase";
import type { User } from "@firebase/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/",
      name: "projects",
      component: () => import("../views/ProjectsView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/project/:id/:path*",
      name: "project",
      component: () => import("../views/ProjectView.vue"),
      props: true,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/reset_password",
      name: "reset_password",
      component: () => import("../views/ResetPassword.vue"),
    },
    {
      path: "/action",
      name: "action",
      component: () => import("../views/ActionView.vue"),
    },
    {
      path: "/reset_password_action",
      name: "reset_password_action",
      component: () => import("../views/ResetPasswordAction.vue"),
      props: true,
    },
    {
      path: "/verify_email_action",
      name: "verify_email_action",
      component: () => import("../views/VerifyEmailAction.vue"),
      props: true,
    },
    {
      path: "/unverified",
      name: "unverified",
      component: () => import("../views/UnverifiedUser.vue"),
      props: true,
      meta: {
        requiresAuth: true,
      },
    },
  ],
});

function userVerified(user: User) {
  const githubVerified = user.providerData.find(
    (provider) => provider.providerId === "github.com"
  );
  return githubVerified !== undefined || user.emailVerified || user.isAnonymous;
}

router.beforeEach((to, from) => {
  console.debug("from", from.fullPath, " -> ", to.fullPath);
  //console.debug("to", to);
  const currentUser = auth.currentUser;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (false && requiresAuth && !currentUser) {
    return { name: "login" };
  } else if (currentUser) {
    const verified = userVerified(currentUser);
    // console.log('Current User verified', verified, 'requesting', to.name)
    if (verified && to.name == "login") {
      console.debug('User is verified and trying to access the login page so send to home page')
      return { name: "projects" };
    } else if (verified && to.name == "unverified") {
      console.debug('User is verified and trying to access the unverified page so send to home page')
      return { name: "projects" };
    } else if (
      !verified &&
      to.name != "unverified" &&
      to.name != "verify_email_action"
    ) {
      console.debug('2. User is unverified and trying to access another page so send to unverified page')
      return { name: "unverified" };
    } else {
      console.debug('User sent to page', to.name)
      return;
    }
  } else {
    console.debug('Anonymous User sent to page that require no auth', to.name)
    return;
  }
});

export default router;
