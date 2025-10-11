import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  files: ["**/*.vue"],
  rules: {
    "vue/attributes-order": [
      "warn",
      {
        alphabetical: true,
        sortLineLength: true,
      },
    ],
  },
});
