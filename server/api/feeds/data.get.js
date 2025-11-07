// @ts-check

/**
 * @typedef {object} FeedData
 * @property {number} count
 * @property {number} errorCount
 * @property {string} [fetchedAt]
 * @property {boolean} imageExists
 * @property {number} unreadCount
 * @property {string} [lastError]
 */

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const categories = await repository.findCategoriesWithFeed(userId);
  const rows = categories.flatMap((c) => c.feeds);
  const [counts, imagePks] = await Promise.all([
    repository.countEntriesByFeedIds(
      userId,
      rows.map((f) => f.id),
    ),
    repository.findImagePks(userId),
  ]);

  /** @type {Record<string,FeedData>} */
  const feeds = {};
  for (const row of rows) {
    feeds[row.id] = {
      count: counts[row.id]?.total ?? 0,
      errorCount: row.errorCount,
      fetchedAt: row.fetchedAt?.toString(),
      imageExists: imagePks.includes(buildFeedImageKey(row.id)),
      lastError: row.lastError,
      unreadCount: counts[row.id]?.unread ?? 0,
    };
  }

  return { feeds };
});
