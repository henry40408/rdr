import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const userId = getUserIdOrThrow(event);
  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const now = await repository.toggleReadEntry(userId, entryId);
  return { success: true, readAt: now };
});
