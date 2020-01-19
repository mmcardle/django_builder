import Vue from 'vue'
import Router from 'vue-router'
import About from './components/About.vue'
import Home from './components/Home.vue'
import Login from '@/components/Login'
import SignUp from '@/components/SignUp'
import Debug from '@/components/Debug'
import Splash from '@/components/Splash'
import Project from '@/components/Project'
import UnVerified from '@/components/UnVerified'
import VerifyAction from '@/components/VerifyAction'
import ResetPasswordAction from '@/components/ResetPasswordAction'
import ResetPassword from '@/components/ResetPassword'
import Error from '@/components/Error'
import firebase from 'firebase/app'
import {userVerified} from '@/firebase_utils'
import VueAnalytics from 'vue-analytics'

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

const analytics_disabled = localStorage.cookie_value == 'false'

Vue.use(VueAnalytics, {
  id: process.env.VUE_APP_GOOGLE_ANALYTICS_ID,
  router,
  disabled: analytics_disabled,
  autoTracking: {
    exception: true
  }
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
