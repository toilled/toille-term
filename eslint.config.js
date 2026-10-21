import js from "@eslint/js";
import globals from "globals";
import solid from "eslint-plugin-solid";
import ts from "typescript-eslint";

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    ...solid.configs["flat/typescript"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "no-unassigned-vars": "off",
    },
  },
  {
    files: ["tests/**/*", "e2e/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "coverage/",
      "test-results/",
      "playwright-report/",
      ".lighthouseci/",
    ],
  },
);
