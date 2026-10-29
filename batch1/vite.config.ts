import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

/** Local preview only — does not replace tip Flutter Pages index.html */
export default defineConfig({
  root: "preview",
  build: {
    outDir: resolve(rootDir, "dist-preview"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        unlink: resolve(rootDir, "preview/unlink.html"),
      },
    },
  },
  server: {
    port: 5179,
    strictPort: true,
  },
});
