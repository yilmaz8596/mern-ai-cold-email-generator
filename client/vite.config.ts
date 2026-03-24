import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config with a dev proxy so the browser can call `/api/*` and Vite will
// forward requests to the `api` container on the Docker network.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://api:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
