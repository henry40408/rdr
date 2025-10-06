export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const feedIds = opmlService.categories.flatMap((cat) => cat.feeds).map((feed) => feed.id);
  const counts = await repository.countEntriesByFeedIds(feedIds);

  return { counts };
});
