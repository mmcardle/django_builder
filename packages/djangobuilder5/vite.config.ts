import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@djangobuilder/core": fileURLToPath(
        new URL("../../lib/djangobuilder-core/src/index.ts", import.meta.url),
      ),
    },
  },
  optimizeDeps: { exclude: ["@djangobuilder/core"] },
});
