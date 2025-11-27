// @ts-check

import { Readable } from "node:stream";
import retry from "p-retry";
import { z } from "zod";

const schema = z.object({
  digest: z.string().length(DIGEST_CONTENT_LENGTH * 2),
});

const querySchema = z.object({
  url: z.url(),
});

const ALLOWED_REQUEST_HEADERS = new Set(["accept", "accept-encoding", "range", "referer"]);
const ALLOWED_RESPONSE_HEADERS = new Set([
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

  /** @type {Headers} */
  const headers = new Headers();
  for (const headerName of ALLOWED_REQUEST_HEADERS) {
    const value = getHeader(event, headerName);
    if (value) headers.set(headerName, value);
  }

  const userAgent = getHeader(event, "user-agent") ?? config.userAgent;
  if (userAgent) headers.set("user-agent", userAgent);

  logger.info({ message: "Proxying image from URL", url, headers });
  try {
    const res = await retry(() => fetch(url, { headers, signal: AbortSignal.timeout(config.httpTimeoutMs) }));
    if (!res.ok) {
      logger.error({ status: res.status, statusText: res.statusText, body: await res.text() });
      throw createError({ statusCode: 502, statusMessage: "Failed to fetch image from URL" });
    }

    if (!res.body) throw createError({ statusCode: 502, statusMessage: "No response body from image URL" });

    for (const key of res.headers.keys()) {
      if (!ALLOWED_RESPONSE_HEADERS.has(key)) continue;
      setHeader(event, key, res.headers.get(key));
    }
    return Readable.fromWeb(/** @type {any} */ (res.body));
  } catch (error) {
    logger.error(error);
    logger.error(`Failed to proxy image from URL: ${url}`);
    throw createError({ statusCode: 502, statusMessage: "Failed to fetch image" });
  }
});
