import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  // Monorepo env files live at repo root (.env.development.local, etc.)
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
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
