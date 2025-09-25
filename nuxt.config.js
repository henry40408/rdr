export default defineNuxtConfig({
  compatibilityDate: "2025-09-25",
  app: {
    head: {
      title: "rdr",
    },
  },
  runtimeConfig: {
    logLevel: "",
    opmlPath: "./data/feeds.opml",
  },
});
