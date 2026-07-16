import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Data-fetching hooks that legitimately call setState before/after
    // an async Supabase fetch — the canonical useEffect pattern.
    files: [
      "src/hooks/use-movimientos.ts",
      "src/hooks/use-clientes.ts",
      "src/hooks/use-notificaciones.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
