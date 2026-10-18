import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";
import { inheritedRules } from "./reference-rules.mjs";

export const ignoredFiles = [
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/src/generated/**",
  "**/*.tsbuildinfo",
];

export function typedConfig({ rootDir, files, globals, rules = {} }) {
  return {
    name: "trading/edupilot-typescript",
    files,
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals,
      parserOptions: { projectService: true, tsconfigRootDir: rootDir },
    },
    plugins: { "@stylistic": stylistic, "import-x": importX },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ alwaysTryTypes: true, project: rootDir }),
      ],
    },
    rules: { ...inheritedRules, ...rules },
  };
}

export function toolingConfig(globals) {
  return {
    name: "trading/javascript-tooling",
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals },
    plugins: { "@stylistic": stylistic, "import-x": importX },
    rules: {
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
    },
  };
}
