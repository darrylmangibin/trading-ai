import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import { ignoredFiles, toolingConfig, typedConfig } from "../../tooling/eslint/shared.mjs";
import { webReferenceRules } from "../../tooling/eslint/reference-rules.mjs";

const typescript = typedConfig({
  rootDir: import.meta.dirname,
  files: ["**/*.{ts,tsx}"],
  globals: globals.browser,
  rules: {
    ...webReferenceRules,
    // Preserve Trading's Hooks correctness checks.
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
  },
});

export default defineConfig([
  globalIgnores(ignoredFiles),
  toolingConfig(globals.node),
  {
    ...typescript,
    extends: [
      ...typescript.extends,
      eslintReact.configs["recommended-typescript"],
      jsxA11y.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
  },
  {
    files: ["**/*.config.{ts,js,mjs,cjs}", "eslint.config.js"],
    languageOptions: { globals: globals.node },
    rules: {
      "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
    },
  },
  {
    files: ["src/test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
      "react-refresh/only-export-components": "off",
    },
  },
]);
