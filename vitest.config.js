import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only the real suite — evals/files/ contains intentionally broken
    // fixture tests used as eval scenarios, never to be executed here.
    include: ["tests/**/*.test.js"],
  },
});
