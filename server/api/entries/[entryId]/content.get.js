import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const schema = z.object({
  entryId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { entryId } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const content = await repository.findEntryContentById(entryId);
  if (!content) throw createError({ statusCode: 404, message: "Entry not found" });

  return { content: sanitizeHtml(content) };
});
