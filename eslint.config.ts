import { Linter } from "eslint";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";

/**
 * ===============================================================================================================
 * Base (server) configuration
 * ===============================================================================================================
 */
const serverConfig: Linter.Config = {
  files: ["**/*.{js,mjs,cjs,ts}"],
  // prettier-ignore
  ignores: [
    "**/*.*config.*",
    "__tests__/**",
    "dist/**/*",
    "coverage/**",
    ".husky/**",
    ".vscode/**",
    ".git/**",
    ".github/**",
    "www/**",
    "www-pub/**",
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
    "no-async-promise-executor": "off",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
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
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/no-explicit-any": [
      "error",
      {
        ignoreRestArgs: true,
      },
    ],
  },
};

/**
 * ===============================================================================================================
 * Client configuration
 * ===============================================================================================================
 */
const clientConfig: Linter.Config = {
  files: ["client/**/*.{ts,tsx}"],
  ignores: ["**/*.*config.*", "dist/**/*"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
      project: "./client/tsconfig.json",
    },
  },
  plugins: {
    "react-compiler": require("eslint-plugin-react-compiler"),
    "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    react: reactPlugin,
    "react-hooks": require("eslint-plugin-react-hooks"),
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react-compiler/react-compiler": "error",
    ...tsPlugin.configs.recommended.rules,
    // React
    "react/jsx-filename-extension": [1, { extensions: [".tsx"] }],
    "react/jsx-props-no-spreading": "off",
    // React Hooks
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    // TypeScript
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-empty-object-type": [
      "error",
      {
        allowInterfaces: "with-single-extends",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": false,
        "ts-ignore": false,
        "ts-nocheck": false,
      },
    ],
  },
};

/**
 * ===============================================================================================================
 * Main, "flat", config
 * ===============================================================================================================
 */
const config: Linter.Config[] = [
  // Base ESLint configuration
  { ...serverConfig },
  // Client ESLint configuration
  { ...clientConfig },
];

export default config;
