import { isProduction } from "std-env";

export default defineNuxtConfig({
  compatibilityDate: "2025-09-25",
  app: {
    head: {
      title: "rdr",
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/android-chrome-192x192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/android-chrome-512x512.png" },
      ],
    },
  },
  css: ["@/assets/css/main.css"],
  modules: ["@nuxt/eslint", "@vueuse/nuxt", "nuxt-auth-utils", "nuxt-quasar-ui"],
  runtimeConfig: {
    dbPath: "./data/db.sqlite3",
    disableSignUp: false,
    httpTimeoutMs: 90000,
    imageDigestSecret: "",
    logLevel: "",
    opmlPath: "./data/feeds.opml",
    userAgent: "Mozilla/5.0 (compatible; rdr/1.0; +https://github.com/henry40408/rdr)",
    session: {
      cookie: {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
        secure: isProduction,
      },
      maxAge: 60 * 60 * 24 * 30, // 30 days
      name: "nuxt-session",
      password: process.env.NUXT_SESSION_PASSWORD || "",
    },
    singleUser: true,
  },
  quasar: {
    plugins: ["Dialog", "Notify"],
  },
});
