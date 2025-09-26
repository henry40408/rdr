export default defineEventHandler(async (event) => {
  const app = useNitroApp();

  const feedId = getRouterParam(event, "feedId");
  if (!feedId) throw createError({ statusCode: 400, statusMessage: "feedId is required" });

  const feed = app.opmlService.findFeedById(feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  const items = await app.feedService.fetchEntries(feed);
  app.repository.upsertEntries(feed, items);

  return { status: "ok" };
});
