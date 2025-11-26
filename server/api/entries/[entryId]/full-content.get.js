// @ts-check

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {DownloadService} */
  const downloadService = container.resolve("downloadService");
  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const entry = await repository.findEntryById(userId, entryId);
  if (!entry) throw createError({ statusCode: 404, statusMessage: "Entry not found" });
  if (!entry.link) throw createError({ statusCode: 400, statusMessage: "Entry has no link" });

  const feed = await repository.findFeedById(userId, entry.feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  const res = await downloadService.downloadText({
    url: entry.link,
    disableHttp2: feed.disableHttp2,
    userAgent: feed.userAgent,
  });
  if (!res.ok) {
    logger.error({ status: res.status, statusText: res.statusText, body: await res.text() });
    throw createError({ statusCode: 500, statusMessage: "Failed to fetch entry content" });
  }

  const doc = new JSDOM(await res.text(), { url: entry.link });
  const reader = new Readability(doc.window.document);
  const parsed = reader.parse();

  const sanitized = rewriteSanitizedContent(parsed?.content || "");
  const proxied = proxyImages(sanitized, feed.htmlUrl);
  return { content: proxied };
});
