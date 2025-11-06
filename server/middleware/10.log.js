// @ts-check

import pino from "pino-http";
import { v7 } from "uuid";

export default defineEventHandler((event) => {
  const logger = pino({
    ...getLoggerOptions(useRuntimeConfig()),
    genReqId: () => v7(),
    redact: [
      "req.headers.authorization",
      "res.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
  });
  logger(event.node.req, event.node.res);
});
