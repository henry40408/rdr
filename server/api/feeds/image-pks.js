export default defineEventHandler(() => {
  const { container } = useNitroApp();

  /** @type {import("../../utils/repository").Repository} */
  const repository = container.resolve("repository");

  return repository.listFeedImagePKs();
});
