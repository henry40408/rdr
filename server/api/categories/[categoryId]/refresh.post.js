export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {import("../../../utils/feed-service").FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {import("../../../utils/opml-service").OpmlService} */
  const opmlService = container.resolve("opmlService");
  /** @type {import("../../../utils/repository").Repository} */
  const repository = container.resolve("repository");

  const categoryId = getRouterParam(event, "categoryId");
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: "categoryId is required" });

  const category = opmlService.findCategoryById(categoryId);
  if (!category) throw createError({ statusCode: 404, statusMessage: "Category not found" });

  const tasks = [];
  for (const feed of category.feeds) {
    const task = async () => {
      const metadata = await repository.findFeedMetadataByFeedId(feed.id);
      const items = await feedService.fetchEntries(feed, metadata);
      if ("ok" === items.type) {
        await repository.upsertEntries(feed, items.items);
        if (items.metadata) {
          await repository.upsertFeedMetadata(items.metadata);
          const image = await feedService.fetchImage(feed, items.metadata);
          if (image) await repository.upsertFeedImage(image);
        }
      }
    };
    tasks.push(task());
  }
  await Promise.all(tasks);

  return { status: "ok" };
});
