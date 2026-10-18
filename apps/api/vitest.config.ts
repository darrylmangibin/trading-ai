import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: { NODE_ENV: "test", PORT: "3000", CORS_ORIGIN: "http://localhost:5173" },
    root: "./",
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
  },
});
