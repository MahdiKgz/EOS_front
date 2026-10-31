import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals, ...nextTs,
  ...[
    ["shared", ["entities", "features", "widgets", "views", "apps"]],
    ["entities", ["features", "widgets", "views", "apps"]],
    ["features", ["widgets", "views", "apps"]],
    ["widgets", ["views", "apps"]],
    ["views", ["apps"]],
  ].map(([layer, forbidden]) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": ["error", { patterns: [{
      group: forbidden.map((name) => `@/${name}/**`),
      message: "FSD: import only from lower layers.",
    }] }] },
  })),
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
