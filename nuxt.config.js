export default defineNuxtConfig({
  compatibilityDate: "2025-09-25",
  app: {
    head: {
      title: "rdr",
    },
  },
  css: ["~/vendor/water.min.css"],
  runtimeConfig: {
    cachePath: "./data/cache.sqlite3",
    logLevel: "",
    opmlPath: "./data/feeds.opml",
    userAgent: "Mozilla/5.0 (compatible; rdr/1.0; +https://github.com/henry40408/rdr)",
  },
});
