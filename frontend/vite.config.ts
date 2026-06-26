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
          // Choose target based on env variables
          target: (() => {
            const useLocal = process.env.VITE_USE_LOCAL_BACKEND === "true";
            const localUrl = process.env.VITE_LOCAL_BACKEND_URL ?? "http://localhost:8080";
            return useLocal ? `${localUrl}/api/v1/` : "https://pipre-backend.yoshua-cloud.dedyn.io/";
          })(),
          changeOrigin: true,
          secure: false,
          // When using the remote endpoint we keep the path unchanged; when using local we need the full path
          rewrite: (path) => path,
        },
        "/api/ia": {
          // IA service proxy – also respects local env if needed (optional)
          target: process.env.VITE_USE_LOCAL_BACKEND === "true"
            ? `${process.env.VITE_LOCAL_BACKEND_URL ?? "http://localhost:8080"}/api/ia/`
            : "https://pipre-ml-ia.yoshua-cloud.dedyn.io/",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/ia/, ""),
        },
    },
  },
});
