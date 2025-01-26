import { Linter } from "eslint";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const config: Linter.Config[] = [
  // Base ESLint configuration
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    // prettier-ignore
    ignores: [
      "*.config.*",
      "__tests__/**",
      "dist/**",
      "coverage/**",
      ".husky/**",
      ".vscode/**",
      ".git/**",
      ".github/**",
      "www/**",
      "cypress/**",
      "node_modules/**"
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // "One-liner" rules
      "no-async-promise-executor": "off",
      "@typescript-eslint/explicit-function-return-type": "error",

      // "Array" rules
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": false,
          "ts-nocheck": false,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          ignoreRestArgs: true,
        },
      ],
    },
  },
];

export default config;
