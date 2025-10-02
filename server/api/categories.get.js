export default defineEventHandler(() => {
  const { container } = useNitroApp();

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");

  return opmlService.categories;
});
