import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Vite config with a dev proxy so the browser can call `/api/*` and Vite will
// forward requests to the backend.
// - In Docker the API container is reachable as `http://api:5000`.
// - Locally (outside Docker) it is `http://localhost:5000`.
// Set VITE_API_TARGET in your .env.local to override (default: localhost).
const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // Forward /api/* as-is — backend mounts routes at /api/auth and /api/ai
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
    // Polling so Vite picks up file changes on Windows bind-mounts in Docker.
    // process.env.CHOKIDAR_USEPOLLING is set by docker-compose.yml.
    watch:
      process.env.CHOKIDAR_USEPOLLING === "true"
        ? { usePolling: true, interval: 500 }
        : {},
  },
});
