export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const categories = await repository.findCategoriesWithFeed();
  const rows = categories.flatMap((c) => c.feeds);
  const [counts, imagePks] = await Promise.all([
    repository.countEntriesByFeedIds(rows.map((f) => f.id)),
    repository.findImagePks(),
  ]);

  /** @type {Record<string,{ count: number, fetchedAt: string|undefined, imageExists: boolean, unreadCount: number }>} */
  const feeds = {};
  for (const row of rows) {
    if (typeof counts[row.id] === "undefined") continue;

    feeds[row.id] = {
      count: counts[row.id].total,
      fetchedAt: row.fetchedAt?.toString(),
      imageExists: imagePks.includes(buildFeedImageKey(row.id)),
      unreadCount: counts[row.id].unread,
    };
  }

  return { feeds };
});
