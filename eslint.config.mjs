import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // next/og exige um <img> cru (não aceita next/image) — desabilitar a regra
    // por arquivo evita depender de um comentário eslint-disable-next-line,
    // cuja detecção de "diretiva não utilizada" se mostrou instável entre
    // CRLF (Windows/local) e LF (Linux/CI).
    files: ["src/app/opengraph-image.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "e2e/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
