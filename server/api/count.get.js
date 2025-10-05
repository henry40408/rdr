import { z } from "zod";

const schema = z.object({
  offset: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(100),
  status: z.enum(["all", "read", "unread"]).default("all"),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const query = await getValidatedQuery(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return { count: await repository.countEntries({ status: query.status }) };
});
