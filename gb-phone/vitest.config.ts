// Woz integration tests only (bridge + UI). Separate from vite.config.ts so the
// TanStack/Nitro plugins are not loaded under test.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      "@woz": fileURLToPath(new URL("../batch1/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: { include: ["tests/woz/**/*.test.{ts,tsx}"], environment: "node" },
});
