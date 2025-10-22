/**
 * @typedef {object} FeedData
 * @property {number} count
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
      fetchedAt: row.fetchedAt?.toString(),
      imageExists: imagePks.includes(buildFeedImageKey(row.id)),
      unreadCount: counts[row.id]?.unread ?? 0,
      lastError: row.lastError,
    };
  }

  return { feeds };
});
