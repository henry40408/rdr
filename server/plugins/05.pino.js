import pino from "pino";
import { isDevelopment } from "std-env";

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    const config = useRuntimeConfig();
    nitroApp.logger = pino({
      level: config.logLevel || (isDevelopment ? "debug" : "info"),
      formatters: {
        bindings: () => ({}),
        level: (label) => ({ level: label }),
      },
    });
  },
);
