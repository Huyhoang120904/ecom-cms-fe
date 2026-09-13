import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

const fromSrc = (...segments: string[]): string =>
  resolve(repoRoot, "src", ...segments);

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the `paths` entries in tsconfig.json.
    alias: [
      { find: /^features\//, replacement: `${fromSrc("features")}/` },
      { find: /^widgets\//, replacement: `${fromSrc("widgets")}/` },
      { find: /^layouts\//, replacement: `${fromSrc("layouts")}/` },
      { find: /^styles\//, replacement: `${fromSrc("styles")}/` },
      { find: /^hooks\//, replacement: `${fromSrc("hooks")}/` },
      { find: /^lib\//, replacement: `${fromSrc("lib")}/` },
      { find: /^app\//, replacement: `${fromSrc("app")}/` },
    ],
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
  },
});
