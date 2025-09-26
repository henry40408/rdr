export default defineEventHandler(async (event) => {
  const app = useNitroApp();

  const feedId = getRouterParam(event, "feedId");
  if (!feedId) throw createError({ statusCode: 400, statusMessage: "feedId is required" });

  const feed = app.opmlService.findFeedById(feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  const metadata = await app.repository.findFeedMetadataByFeedId(feedId);
  const items = await app.feedService.fetchEntries(feed, metadata);
  if ("ok" === items.type) {
    await app.repository.upsertEntries(feed, items.items);
    if (items.metadata) {
      await app.repository.upsertFeedMetadata(items.metadata);
      const image = await app.feedService.fetchImage(feed, items.metadata);
      if (image) await app.repository.upsertFeedImage(image);
    }
  }

  return { status: "ok" };
});
