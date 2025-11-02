import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/{e2e,unit}/*.{test,spec}.js"],
          environment: "node",
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/nuxt/*.{test,spec}.js"],
          environment: "nuxt",
        },
      }),
    ],
  },
});
