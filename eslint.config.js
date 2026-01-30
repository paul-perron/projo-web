// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  // Put ignores here (since .eslintignore is deprecated)
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "material-dashboard-react/**",
      "src/assets-dashboard/**",
      "src/ui/**", // remove this if you actually want to lint UI files you copied in
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React hooks rules (this is what your error is about)
      ...reactHooks.configs.recommended.rules,

      // optional: keep react-refresh rule if you had it before
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];