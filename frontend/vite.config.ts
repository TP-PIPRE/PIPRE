import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 5173, // Puerto por defecto de Vite
    proxy: {
      "/api/v1": {
        target: "https://pipre-backend.yoshua-cloud.dedyn.io/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      "/api/ia": {
        target: "https://pipre-ml-ia.yoshua-cloud.dedyn.io/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ia/, ""),
      },
    },
  },
});
