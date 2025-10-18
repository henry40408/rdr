import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  files: ["**/*.js", "**/*.vue"],
  rules: {
    "sort-imports": "warn",
    "vue/attributes-order": [
      "warn",
      {
        alphabetical: true,
        sortLineLength: true,
      },
    ],
  },
});
