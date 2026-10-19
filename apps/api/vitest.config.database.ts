import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: { NODE_ENV: "test" },
    root: "./",
    include: ["test/database/**/*.db-spec.ts"],
    maxWorkers: 1,
    fileParallelism: false,
    passWithNoTests: false,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
