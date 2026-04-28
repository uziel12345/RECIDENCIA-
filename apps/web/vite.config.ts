/**
 * vite.config.ts
 *
 * CORRECCIÓN:
 * Se eliminó el host ngrok hardcodeado "graffiti-tinsmith-cinnamon.ngrok-free.dev".
 * Ahora acepta CUALQUIER host para que funcione con cualquier túnel ngrok,
 * en cualquier red local, o en producción sin modificar este archivo.
 *
 * Para producción se recomienda restringir allowedHosts al dominio real.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host:  "0.0.0.0",
    port:  5173,

    // ANTES: ["graffiti-tinsmith-cinnamon.ngrok-free.dev"]
    // AHORA: true acepta cualquier host (ngrok, red local, etc.)
    allowedHosts: true,

    proxy: {
      "/api": {
        target:       "http://localhost:3001",
        changeOrigin: true,
        secure:       false,
      },
    },
  },
});
