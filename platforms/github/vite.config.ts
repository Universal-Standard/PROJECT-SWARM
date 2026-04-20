import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/PROJECT-SWARM/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "../../client/src"),
      "@shared": path.resolve(import.meta.dirname, "../../shared"),
      "@platform": path.resolve(import.meta.dirname, "./src"),
    },
  },
  root: path.resolve(import.meta.dirname, "../../client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  define: {
    "import.meta.env.VITE_BACKEND": JSON.stringify("github"),
  },
});
