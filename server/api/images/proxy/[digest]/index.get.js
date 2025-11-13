// @ts-check

import got from "got";
import { pipeline as streamPipeline } from "node:stream/promises";
import { z } from "zod";

const schema = z.object({
  digest: z.string().length(DIGEST_CONTENT_LENGTH * 2),
});

const querySchema = z.object({
  url: z.url(),
});

const ALLOWED_HEADERS = new Set([
  "cache-control",
  "content-disposition",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "last-modified",
]);

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.imageDigestSecret)
    throw createError({ statusCode: 503, statusMessage: "Image digest secret not configured" });

  const { container } = useNitroApp();

  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");

  const { digest } = await getValidatedRouterParams(event, (params) => schema.parse(params));
  const { url } = await getValidatedQuery(event, (query) => querySchema.parse(query));

  const expectedDigest = digestUrl(config.imageDigestSecret, url);
  if (expectedDigest !== digest) throw createError({ statusCode: 400, statusMessage: "Invalid digest" });

  /** @type {import('got').Headers} */
  const headers = {};
  const proxyHeaderKeys = ["accept", "accept-encoding", "range", "referer"];
  for (const headerName of proxyHeaderKeys) {
    const value = getHeader(event, headerName);
    if (value) headers[headerName] = value;
  }

  const userAgent = getHeader(event, "user-agent") ?? config.userAgent;
  if (userAgent) headers["user-agent"] = userAgent;

  logger.info({ message: "Proxying image from URL", url, headers });
  const stream = got.stream(url, {
    headers,
    timeout: { request: config.httpTimeoutMs },
  });

  stream.on("response", (response) => {
    for (const key of Object.keys(response.headers)) if (!ALLOWED_HEADERS.has(key)) delete response.headers[key];
  });

  stream.on("error", (error) => {
    logger.error(error);
    logger.error(`Failed to proxy image from URL: ${url}`);
    sendError(event, createError({ statusCode: 502, statusMessage: "Failed to fetch image" }));
  });

  await streamPipeline(stream, event.node.res);
});
