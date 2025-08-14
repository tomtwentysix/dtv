import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Dynamically detect all .html files in client/
const htmlEntries: Record<string, string> = {};
const clientDir = path.resolve(__dirname, "client");

fs.readdirSync(clientDir).forEach((file) => {
  if (file.endsWith(".html")) {
    const name = path.basename(file, ".html");
    htmlEntries[name] = path.resolve(clientDir, file);
  }
});

export default defineConfig({
  plugins: [react()],
  root: clientDir,
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: htmlEntries
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});
