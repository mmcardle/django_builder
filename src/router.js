import Vue from 'vue'
import Router from 'vue-router'
import About from './components/About.vue'
import Home from './components/Home.vue'
import Login from '@/components/Login.vue'
import SignUp from '@/components/SignUp.vue'
import Debug from '@/components/Debug.vue'
import Splash from '@/components/Splash.vue'
import Project from '@/components/Project.vue'
import UnVerified from '@/components/UnVerified.vue'
import VerifyAction from '@/components/VerifyAction.vue'
import ResetPasswordAction from '@/components/ResetPasswordAction.vue'
import ResetPassword from '@/components/ResetPassword.vue'
import Error from '@/components/Error.vue'
import firebase from 'firebase/compat/app';
import {userVerified} from '@/firebase_utils'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '*',
      redirect: { name: 'Splash' }
    },
    {
      path: '/',
      name: 'Splash',
      component: Splash
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/unverified',
      name: 'UnVerified',
      component: UnVerified,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/reset_password',
      name: 'ResetPassword',
      component: ResetPassword,
    },
    {
      path: '/verify/:oobCode',
      name: 'VerifyAction',
      component: VerifyAction,
      props: true
    },
    {
      path: '/reset/:oobCode',
      name: 'ResetPasswordAction',
      component: ResetPasswordAction,
      props: true
    },
    {
      path: '/action',
      name: 'Action',
    },
    {
      path: '/error',
      name: 'Error',
      component: Error
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
    {
      path: '/project/:id',
      name: 'Project',
      component: Project,
      props: true,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/debug',
      name: 'Debug',
      component: Debug,
      meta: {
        requiresAuth: true
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  //console.log('to', to)
  //console.log('from', from)
  let currentUser = firebase.auth().currentUser;
  let requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (requiresAuth && !currentUser) {
    //console.log('User is unauthenticated so send them to Splash')
    next({name: 'Splash'})
  } else if (to.name === 'Action') {
    if (!to.query || !to.query.mode) {
      next({name: 'Error'})
    } else if (to.query.mode === 'verifyEmail'){
      next({name: 'VerifyAction', params: to.query})
    } else if (to.query.mode === 'resetPassword') {
      next({name: 'ResetPasswordAction', params: to.query})
    } else {
      next({name: 'Error'})
    }
  } else if (currentUser) {
    const verified = userVerified(currentUser)
    // console.log('Current User verified', verified, 'requesting', to.name)
    //if (currentUser.isAnonymous && to.name == 'UnVerified') {
    //  console.log('User is anonymous and trying to access the unverified page so send to home page')
    //  next({name: 'Home'})
    //} else if (currentUser.isAnonymous) {
    //  console.log('User is anonymous and not trying to access the unverified page so send to the next page')
    //  next()
    //} else
    if (verified && to.name == 'Login') {
      // console.log('User is verified and trying to access the login page so send to home page')
      next({name: 'Home'})
    } else if (verified && to.name == 'UnVerified') {
      // console.log('User is verified and trying to access the unverified page so send to home page')
      next({name: 'Home'})
    } else if (!verified && to.name != 'UnVerified' && to.name != 'VerifyAction') {
      // console.log('2. User is unverified and trying to access another page so send to unverified page')
      next({name: 'UnVerified'})
    } else {
      // console.log('User sent to page', to.name)
      next()
    }
  } else {
    // console.log('Anonymous User sent to page that require no auth', to.name)
    next()
  }
})

export default router
