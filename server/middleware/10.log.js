import pino from "pino-http";
import { v7 } from "uuid";
import { getLoggerOptions } from "../utils/logger-options";

export default defineEventHandler((event) => {
  const logger = pino({
    ...getLoggerOptions(useRuntimeConfig()),
    genReqId: () => v7(),
  });
  logger(event.node.req, event.node.res);
});
