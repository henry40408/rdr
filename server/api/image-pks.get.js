export default defineEventHandler(() => {
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return repository.listImagePks();
});
