import nest from "@darraghor/eslint-plugin-nestjs-typed";
import { defineConfig, globalIgnores } from "eslint/config";
import node from "eslint-plugin-n";
import globals from "globals";
import { ignoredFiles, toolingConfig, typedConfig } from "../../tooling/eslint/shared.mjs";
import { apiReferenceRules } from "../../tooling/eslint/reference-rules.mjs";

const typescript = typedConfig({
  rootDir: import.meta.dirname,
  files: ["**/*.ts"],
  globals: globals.node,
  rules: {
    ...apiReferenceRules,
    // NodeNext requires the emitted .js extension in local API imports.
    "import-x/extensions": ["error", "ignorePackages", { js: "always", ts: "never" }],
    "@typescript-eslint/no-floating-promises": "error",
  },
});

export default defineConfig([
  globalIgnores(ignoredFiles),
  toolingConfig(globals.node),
  {
    ...typescript,
    extends: [
      ...typescript.extends,
      node.configs["flat/recommended-module"],
      nest.configs.flatRecommended,
      nest.configs.flatNoSwagger,
    ],
    settings: { ...typescript.settings, node: { version: ">=24.17.0" } },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "@darraghor/nestjs-typed/injectable-should-be-provided": [
        "error",
        {
          src: [`${import.meta.dirname.replaceAll("\\", "/")}/src/**/*.ts`],
          filterFromPaths: ["node_modules", "\\.test\\.", "\\.spec\\.", "/generated/"],
        },
      ],
    },
  },
  {
    files: ["test/**/*.ts", "**/*.spec.ts", "**/*.db-spec.ts", "*.config*.ts"],
    rules: {
      "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
    },
  },
  {
    files: ["scripts/**/*.ts", "src/commands/**/*.ts", "prisma/seeders/**/*.ts"],
    rules: { "no-console": "off" },
  },
]);
