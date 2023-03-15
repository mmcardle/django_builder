import { fileURLToPath, URL } from "node:url";

import { defineConfig, type ViteDevServer } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

const dotPathFixPlugin = () => ({
  // This plugin allows path to have an file extension
  // e.g. dicoms/eu/testing/1111/X001/TP1111_X001_trauma_bone.vtp
  name: "dot-path-fix-plugin",
  configureServer: (server: ViteDevServer) => {
    server.middlewares.use((req, _, next) => {
      const reqPath = req.url?.split("?", 2)[0];
      if (reqPath?.startsWith("/project")) {
        req.url = "/";
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), dotPathFixPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
