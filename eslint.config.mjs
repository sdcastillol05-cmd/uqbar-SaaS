import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // `react-hooks/set-state-in-effect` (new in the v6 hooks plugin shipped
    // with Next 15) flags the standard "setLoading(true) before an async
    // fetch inside useEffect" pattern as an error, even though this is the
    // documented, canonical way to fetch external data and sync local
    // state — see https://react.dev/learn/synchronizing-with-effects.
    // We keep the rule everywhere else and only relax it for our
    // data-fetching hooks, which intentionally follow that pattern.
    files: ["src/hooks/use-movimientos.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
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
