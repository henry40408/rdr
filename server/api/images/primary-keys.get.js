export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const userId = getUserIdOrThrow(event);

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return await repository.findImagePks(userId);
});
