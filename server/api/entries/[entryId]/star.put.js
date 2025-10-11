import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  const now = await repository.toggleStarEntry(Number(entryId));
  return { success: true, readAt: now };
});
