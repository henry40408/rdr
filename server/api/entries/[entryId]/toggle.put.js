import { z } from "zod";

const schema = z.object({
  entryId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { entryId } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const now = await repository.toggleEntry(entryId);
  return { success: true, readAt: now };
});
