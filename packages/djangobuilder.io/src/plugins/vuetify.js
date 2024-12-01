import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import 'vuetify/dist/vuetify.min.css'
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify)

const opts = {
  dark: true,
  icons: {
    iconfont: 'mdiSvg',
  },
  theme: {
    primary: colors.blue.darken3,
    secondary: colors.grey.darken1,
    accent: colors.shades.black,
    error: colors.red.darken3,
  }
}

export default new Vuetify(opts);
