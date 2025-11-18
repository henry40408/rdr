// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const categories = await repository.findCategoriesWithFeed(userId);
  const feeds = categories.flatMap((c) => c.feeds);
  const [counts, imagePks] = await Promise.all([
    repository.countEntriesByFeedIds(
      userId,
      feeds.map((f) => f.id),
    ),
    repository.findImagePks(userId),
  ]);

  return categories.map((category) => ({
    ...category,
    feeds: category.feeds.map((feed) => ({
      ...feed,
      imageExists: imagePks.includes(buildFeedImageKey(feed.id)),
      unreadCount: counts[feed.id]?.unread ?? 0,
    })),
  }));
});
