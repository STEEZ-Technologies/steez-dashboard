import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored from the bklit shadcn registry (ui.bklit.com). Upstream code we
    // re-pull on updates, so it is not held to our react-hooks rules.
    "components/charts/**",
    // Third-party minified bundles served as static files.
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
