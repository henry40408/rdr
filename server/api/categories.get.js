export default defineEventHandler(() => {
  const { container } = useNitroApp();

  /** @type {import("../utils/opml-service").OpmlService} */
  const opmlService = container.resolve("opmlService");

  return opmlService.categories;
});
