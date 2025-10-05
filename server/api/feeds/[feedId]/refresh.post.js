import { z } from "zod";

const schema = z.object({
  feedId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");

  const { feedId } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  const feed = opmlService.findFeedById(feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  await Promise.all([feedService.fetchAndSaveEntries(feed), feedService.fetchImage(feed)]);

  return { status: "ok" };
});
