export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

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
    tasks.push(feedService.fetchAndSaveEntries(feed));
  }
  await Promise.all(tasks);

  return { status: "ok" };
});
