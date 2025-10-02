export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return repository.listFeedMetadata();
});
