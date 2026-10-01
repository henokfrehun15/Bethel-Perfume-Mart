import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    // Provides DATABASE_URL/JWT_SECRET defaults so config/env.ts can
    // load in CI, where no .env file exists.
    setupFiles: ["./src/tests/setup.ts"],

    // Integration tests talk to a real database (see
    // src/tests/integration); unit tests with mocked pools are fast.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
