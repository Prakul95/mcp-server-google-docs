// eslint.config.ts (Flat config)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default tseslint.config(
  // Ignore junk
  { ignores: ["dist/**", "build/**", "coverage/**", "node_modules/**"] },

  // Base JS rules
  js.configs.recommended,

  // Make Node globals available in JS scripts (fixes "process/console is not defined")
  {
    files: ["scripts/**/*.js", "src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node }, // gives process, console, __dirname, etc.
    },
    rules: {
      // keep or add JS-only tweaks here
    },
  },

  // Baseline TS rules (non type-aware for now = far fewer “unsafe any/unknown” errors)
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // IMPORTANT: no "project" here -> not type-aware, keeps noise down
      },
    },
    rules: {
      // Keep useful safety, relax the screamers for now
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/only-throw-error": "off",

      // These are code-style nits that your current code intentionally uses
      "no-case-declarations": "off",
      "no-control-regex": "off",
    },
  },
);
