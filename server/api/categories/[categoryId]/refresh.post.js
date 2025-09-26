export default defineEventHandler(async (event) => {
  const app = useNitroApp();

  const categoryId = getRouterParam(event, "categoryId");
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: "categoryId is required" });

  const category = app.opmlService.findCategoryById(categoryId);
  if (!category) throw createError({ statusCode: 404, statusMessage: "Category not found" });

  const tasks = [];
  for (const feed of category.feeds) {
    const task = async () => {
      const metadata = await app.repository.findFeedMetadataByFeedId(feed.id);
      const items = await app.feedService.fetchEntries(feed, metadata);
      if ("ok" === items.type) {
        await app.repository.upsertEntries(feed, items.items);
        if (items.metadata) await app.repository.upsertFeedMetadata(items.metadata);
      }
    };
    tasks.push(task());
  }
  await Promise.all(tasks);

  return { status: "ok" };
});
