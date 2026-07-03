import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function normalizeHost(value?: string): string | undefined {
  if (!value) return undefined;

  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const allowedHost = normalizeHost(env.VITE_ALLOWED_HOST);
  const hmrHost = normalizeHost(env.VITE_HMR_HOST) ?? allowedHost;

  return {
    plugins: [tailwindcss(), react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-motion": ["framer-motion"],
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,

      allowedHosts: allowedHost ? [allowedHost] : true,

      ...(hmrHost
        ? {
            hmr: {
              protocol: "wss",
              host: hmrHost,
              clientPort: 443,
            },
          }
        : {}),

      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});