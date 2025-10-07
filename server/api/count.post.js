import { z } from "zod";

const schema = z.object({
  feedIds: z.array(z.string()).optional(),
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().nullable().optional(),
  status: z.enum(["all", "read", "unread"]).default("all"),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { feedIds, search, status } = await readValidatedBody(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return {
    count: await repository.countEntries({ feedIds, search: search || undefined, status }),
  };
});
