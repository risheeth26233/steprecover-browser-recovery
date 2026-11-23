import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "extension",
  plugins: [react()],
  build: {
    outDir: "../dist/extension",
    emptyOutDir: true,
    rollupOptions: { input: "extension/sidepanel.html" },
  },
});
