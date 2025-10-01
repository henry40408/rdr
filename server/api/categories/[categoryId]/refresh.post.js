export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");
  /** @type {import("../../../utils/feed-service").FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {import("../../../utils/opml-service").OpmlService} */
  const opmlService = container.resolve("opmlService");

  const categoryId = getRouterParam(event, "categoryId");
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: "categoryId is required" });

  const category = opmlService.findCategoryById(categoryId);
  if (!category) throw createError({ statusCode: 404, statusMessage: "Category not found" });

  const tasks = [];
  for (const feed of category.feeds) {
    const task = async () => {
      await Promise.all([feedService.fetchAndSaveEntries(feed), feedService.fetchImage(feed)]);
    };
    tasks.push(task());
  }

  const results = await Promise.allSettled(tasks);
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const feed = category.feeds[i];
      const childLogger = logger.child({ feedId: feed.id });
      childLogger.error(result.reason);
      childLogger.error("One of the feed refresh tasks failed");
    }
  }

  return { status: "ok" };
});
