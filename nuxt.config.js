import { isProduction } from "std-env";

export default defineNuxtConfig({
  compatibilityDate: "2025-09-25",
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/android-chrome-192x192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/android-chrome-512x512.png" },
      ],
      meta: [{ name: "referrer", content: "no-referrer" }],
      title: "rdr",
    },
  },
  css: ["@/assets/css/main.css", "@/assets/css/anchor.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/test-utils/module",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "nuxt-auth-utils",
    "nuxt-quasar-ui",
    "nuxt-security",
  ],
  runtimeConfig: {
    dbPath: "./data/db.sqlite3",
    enableSignUp: false,
    errorThreshold: 5,
    httpTimeoutMs: 30_000,
    imageDigestSecret: "",
    logLevel: "",
    multiUser: false,
    public: {
      buildDate: new Date().toISOString(),
      version: "dev",
    },
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
    webauthn: {
      register: {
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "preferred",
        },
      },
    },
  },
  auth: { webAuthn: true },
  quasar: {
    plugins: ["Dark", "Dialog", "LoadingBar", "Notify"],
    config: {
      brand: {
        primary: "#4682B4",
        secondary: "#5F9EA0",
        accent: "#FF7F50",
        positive: "#3CB371",
        negative: "#FF6347",
        info: "#1E90FF",
        warning: "#FFA500",
        // dark: "#2F4F4F", // use default dark color
      },
      dark: true,
    },
  },
  security: {
    // Built-in rate limiter is not suitable for complex production applications.
    // It is meant to help simpler applications handle the issue of brute forcing.
    // To correctly protect your production application against brute forcing,
    // you should use solutions that work on the infrastructure layer,
    // not the application layer.
    rateLimiter: false,
  },
});
