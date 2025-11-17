// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return repository.findCategoriesWithFeed(session.user.id);
});
