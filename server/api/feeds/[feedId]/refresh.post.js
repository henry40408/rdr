import { z } from "zod";

const schema = z.object({
  feedId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const { feedId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  const feed = await repository.findFeedById(feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  await Promise.all([feedService.fetchAndSaveEntries(feed), feedService.fetchImage(feed)]);

  return { status: "ok" };
});
