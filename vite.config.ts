import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "node:path";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, "./src/lib"),
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/solid-js") ||
            id.includes("node_modules/@solidjs")
          ) {
            return "solid-vendor";
          }
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["tests/setup.js"],
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    isolate: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: ["dist/**", "e2e/**", "tests/**", "scripts/**", "**/*.d.ts"],
    },
  },
});
