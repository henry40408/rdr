export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");

  return { count: await repository.countEntries() };
});
