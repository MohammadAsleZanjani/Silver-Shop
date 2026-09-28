import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    sequence: { concurrent: false },
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/silver_mvp_test",
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
