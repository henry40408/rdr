import { isDevelopment } from "std-env";

/**
 * @param {import('nuxt/schema').RuntimeConfig} config
 * @returns {import('pino').LoggerOptions}
 */
export function getLoggerOptions(config) {
  return {
    level: config.logLevel || (isDevelopment ? "debug" : "info"),
    formatters: {
      bindings: () => ({}),
      level: (label) => ({ level: label }),
    },
  };
}
