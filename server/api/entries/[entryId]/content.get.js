// @ts-check

import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const entry = await repository.findEntryById(userId, entryId);
  if (!entry) throw createError({ statusCode: 404, message: "Entry not found" });

  const feed = await repository.findFeedById(userId, entry.feedId);
  if (!feed) throw createError({ statusCode: 404, message: "Feed not found" });

  const content = await repository.findEntryContentById(userId, entryId);
  if (!content) return { content: "" };

  const trimmed = content.trim();
  if (trimmed === "") return { content: "" };

  const sanitized = rewriteSanitizedContent(trimmed);
  const proxied = proxyImages(sanitized, feed.htmlUrl);
  return {
    content: proxied,
  };
});
