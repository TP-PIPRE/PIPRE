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
        secure: false, // Permite conexiones a backends con certificados no válidos (solo para desarrollo)
        rewrite: (path) => path, // No reescribe la ruta, envíala tal cual al backend
      },
    },
  },
});
