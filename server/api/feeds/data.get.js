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
