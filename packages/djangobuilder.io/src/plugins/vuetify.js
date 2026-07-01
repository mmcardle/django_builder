import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import colors from 'vuetify/util/colors'

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: colors.blue.darken3,
          secondary: colors.grey.darken1,
          accent: colors.shades.black,
          error: colors.red.darken3,
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
