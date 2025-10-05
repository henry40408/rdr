import sanitizeHtml from "sanitize-html";

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing entry ID" });

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const content = await repository.findEntryContentById(id);
  if (!content) throw createError({ statusCode: 404, message: "Entry not found" });

  return { content: sanitizeHtml(content) };
});
