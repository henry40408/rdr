export default defineEventHandler(async (event) => {
  const app = useNitroApp();

  const categoryId = getRouterParam(event, "categoryId");
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: "categoryId is required" });

  const category = app.opmlService.findCategoryById(categoryId);
  if (!category) throw createError({ statusCode: 404, statusMessage: "Category not found" });

  const tasks = [];
  for (const feed of category.feeds) {
    tasks.push(app.feedService.fetchEntries(feed));
  }
  await Promise.all(tasks);

  return { status: "ok" };
});
