import got from "got";
import { pipeline as streamPipeline } from "node:stream/promises";
import { z } from "zod";

const schema = z.object({
  digest: z.string().length(16),
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

  const { digest } = await getValidatedRouterParams(event, (params) => schema.parse(params));
  const { url } = await getValidatedQuery(event, (query) => querySchema.parse(query));

  if (!config.imageDigestSecret)
    throw createError({ statusCode: 500, statusMessage: "Image digest secret not configured" });

  const expectedDigest = digestUrl(config.imageDigestSecret, url);
  if (expectedDigest !== digest) throw createError({ statusCode: 400, statusMessage: "Invalid digest" });

  await streamPipeline(
    got
      .stream(url, {
        headers: { "user-agent": config.userAgent },
        timeout: { request: config.httpTimeoutMs },
      })
      .on("response", (response) => {
        for (const header of Object.keys(response.headers))
          if (!ALLOWED_HEADERS.has(header.toLowerCase())) delete response.headers[header];
      }),
    event.node.res,
  );
});
