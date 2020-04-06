import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import 'vuetify/src/stylus/app.styl'
import colors from 'vuetify/es5/util/colors'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faProjectDiagram, faSignOutAlt, faSignInAlt, faDatabase, faUser, faUserSecret,
  faGripHorizontal, faTrash, faCircle, faCaretSquareDown, faCircleNotch,
  faInfoCircle, faArrowRight, faArrowLeft, faArrowDown, faFileDownload,
  faEllipsisH, faCheck, faSquare, faCheckCircle, faTimesCircle
} from '@fortawesome/free-solid-svg-icons'

import {
  faGithub, faTwitter
} from '@fortawesome/free-brands-svg-icons'

library.add(faGithub)
library.add(faProjectDiagram)
library.add(faTwitter)
library.add(faSignOutAlt)
library.add(faSignInAlt)
library.add(faDatabase)
library.add(faUser)
library.add(faUserSecret)
library.add(faGripHorizontal)
library.add(faTrash)
library.add(faCircle)
library.add(faCircleNotch)
library.add(faCaretSquareDown)
library.add(faInfoCircle)
library.add(faArrowRight)
library.add(faArrowLeft)
library.add(faArrowDown)
library.add(faFileDownload)
library.add(faEllipsisH)
library.add(faCheck)
library.add(faSquare)
library.add(faTimesCircle)
library.add(faCheckCircle)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(Vuetify, {
  iconfont: 'md',
  theme: {
    primary: colors.blue.darken3,
    secondary: colors.grey.darken1,
    accent: colors.shades.black,
    error: colors.red.darken3,
  }
})
