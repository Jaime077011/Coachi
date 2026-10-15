import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Arabic is right-to-left: only logical classes (ms, me, ps, pe, start, end, text-start) may be used.
// Matches physical classes even behind variants, e.g. "ml-4", "lg:pr-2", "-left-1", "text-right", "rounded-l-lg".
const physical =
  "/(^|[\\s:])(-?(m[lr]|p[lr]|left|right)-|text-(left|right)(\\s|$)|(rounded|border)-[lr](-|\\s|$))/";
const message =
  "Use logical classes (ms-, me-, ps-, pe-, start-, end-, text-start, text-end, rounded-s/e, border-s/e) so Arabic flips on its own.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    // shadcn parts are vendored; its --rtl setup already handles direction.
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${physical}]`, message },
        { selector: `TemplateElement[value.raw=${physical}]`, message },
      ],
    },
  },
  {
    // Vendored shadcn parts: keep them as generated.
    files: ["src/components/ui/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
