import 'vuetify/styles'
import { createVuetify } from 'vuetify'

// NOTE: The Vue 2 config set `dark: true` at the root of the options object
// (and colors directly under `theme:`), but neither was a valid Vuetify 2
// location, so both were ignored and production has always rendered with the
// default light theme. We keep that behaviour here to match production.
export default createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  icons: {
    defaultSet: 'mdi',
  },
})
