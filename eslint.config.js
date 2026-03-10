import js from "@eslint/js";
import nodePlugin from "eslint-plugin-node";
import promisePlugin from "eslint-plugin-promise";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "*.min.js",
      ".env",
      ".env.*",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      node: nodePlugin,
      promise: promisePlugin,
      import: importPlugin,
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "arrow-body-style": ["error", "as-needed"],
      "object-shorthand": ["error", "always"],
      "prefer-destructuring": [
        "error",
        {
          object: true,
          array: false,
        },
      ],
      "no-param-reassign": "error",
      "no-return-await": "error",
      "require-await": "error",
      "no-throw-literal": "error",
      complexity: ["warn", 10],
      "max-depth": ["warn", 3],
      "max-lines-per-function": [
        "warn",
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-nested-callbacks": ["warn", 3],
      "max-params": ["warn", 4],
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-alert": "error",
      curly: ["error", "all"],
      "dot-notation": "error",
      "no-else-return": "error",
      "no-empty-function": "warn",
      "no-magic-numbers": [
        "warn",
        {
          ignore: [0, 1, -1, 3, 4, 10],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      "no-multi-spaces": "error",
      yoda: "error",
    },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js", "**/tests/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    rules: {
      "no-magic-numbers": "off",
      "max-lines-per-function": "off",
    },
  },
  prettier,
];
