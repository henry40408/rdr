export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {FeedService} */
  const feedService = container.resolve("feedService");

  return feedService.fetchingFeedIds();
});
