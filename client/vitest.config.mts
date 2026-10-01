import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    // Pure logic tests only (e.g. src/lib/cart.ts) — component
    // rendering would need jsdom + testing-library.
    include: ["src/**/*.test.ts"],
  },
});