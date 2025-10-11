export default defineNuxtConfig({
  compatibilityDate: "2025-09-25",
  app: {
    head: {
      title: "rdr",
    },
  },
  modules: ["@nuxt/eslint", "@vueuse/nuxt", "nuxt-quasar-ui"],
  runtimeConfig: {
    cachePath: "./data/cache.sqlite3",
    httpTimeoutMs: 90000,
    logLevel: "",
    opmlPath: "./data/feeds.opml",
    userAgent: "Mozilla/5.0 (compatible; rdr/1.0; +https://github.com/henry40408/rdr)",
  },
  quasar: {
    plugins: ["Notify"],
  },
});
