import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      "db/schema/**",
      "resources/**",
      "components/dashboard/**",
      "lib/analytics.ts",
      "lib/cache.ts",
      "lib/resource/**"
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-irregular-whitespace": "off",
      "no-control-regex": "off",
    }
  }
);
