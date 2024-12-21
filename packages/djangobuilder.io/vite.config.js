import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2";
import Components from 'unplugin-vue-components/vite'
import { fileURLToPath, URL } from "url";

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
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})