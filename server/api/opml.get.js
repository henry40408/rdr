export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");

  setHeader(event, "Content-Disposition", 'attachment; filename="feeds.opml"');
  setHeader(event, "Content-Type", "text/xml; charset=utf-8");

  return await opmlService.exportOpml(userId);
});
