export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");
  /** @type {FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {OpmlService} */
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

  await Promise.allSettled(tasks);

  return { status: "ok" };
});
