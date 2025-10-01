export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {import("../../../utils/feed-service").FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {import("../../../utils/opml-service").OpmlService} */
  const opmlService = container.resolve("opmlService");

  const feedId = getRouterParam(event, "feedId");
  if (!feedId) throw createError({ statusCode: 400, statusMessage: "feedId is required" });

  const feed = opmlService.findFeedById(feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  await Promise.all([feedService.fetchAndSaveEntries(feed), feedService.fetchImage(feed)]);

  return { status: "ok" };
});
