import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      // These React Compiler-era rules flag intentional patterns used across the
      // legacy dashboard (deriving UI state from effects, memoized handlers).
      // They are advisory, not correctness checks, and the codebase still uses
      // them widely.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default config;