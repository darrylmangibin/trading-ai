/** @type {import("jest").Config} */
module.exports = {
  clearMocks: true,
  // RTL detects Jest's runtime global to advance fake timers around interactions.
  injectGlobals: true,
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/src/test/style-mock.cjs",
  },
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        babelrc: false,
        configFile: false,
        presets: [
          ["@babel/preset-env", { targets: { node: "24.17" }, modules: "commonjs" }],
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
      },
    ],
  },
};
