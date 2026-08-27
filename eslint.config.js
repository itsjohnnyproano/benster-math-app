// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      // Hook lifecycle tests intentionally call mocked hooks without a renderer,
      // and hoisted mocks must be declared before the imports they replace.
      "import/first": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  }
]);
