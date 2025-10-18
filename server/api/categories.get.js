export default defineEventHandler((event) => {
  const { container } = useNitroApp();

  const userId = getUserIdOrThrow(event);

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return repository.findCategoriesWithFeed(userId);
});
