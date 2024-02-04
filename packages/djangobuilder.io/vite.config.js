import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2";
import Components from 'unplugin-vue-components/vite'

const path = require("path");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        {
          type: 'component',
          resolve: (name) => {
            const blackList = ['VChart', 'VHeadCard']
            if (name.match(/^V[A-Z]/) && !blackList.includes(name))
              return { name, from: 'vuetify/lib' }
          },
        },
      ],
      dts: false,
      types: [],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})