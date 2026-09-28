import { defineConfig } from "vitest/config";
import path from "node:path";

const TEST_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:54330/postgres?sslmode=disable&pgbouncer=true";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    sequence: { concurrent: false },
    globalSetup: ["./tests/global-setup.mjs"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DEFAULT_USER_ID: "default-user",
      DEFAULT_MARKET_ID: "default-market",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
