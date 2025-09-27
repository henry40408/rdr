export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {import("../../../utils/feed-service").FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {import("../../../utils/opml-service").OpmlService} */
  const opmlService = container.resolve("opmlService");
  /** @type {import("../../../utils/repository").Repository} */
  const repository = container.resolve("repository");

  const feedId = getRouterParam(event, "feedId");
  if (!feedId) throw createError({ statusCode: 400, statusMessage: "feedId is required" });

  const feed = opmlService.findFeedById(feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  const metadata = await repository.findFeedMetadataByFeedId(feedId);
  const items = await feedService.fetchEntries(feed, metadata);
  if ("ok" === items.type) {
    await repository.upsertEntries(feed, items.items);
    if (items.metadata) {
      await repository.upsertFeedMetadata(items.metadata);
      const image = await feedService.fetchImage(feed, items.metadata);
      if (image) await repository.upsertFeedImage(image);
    }
  }

  return { status: "ok" };
});
