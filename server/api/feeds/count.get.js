// @ts-check

import { z } from "zod";

const schema = z.object({
  status: z.enum(["all", "error"]).default("all"),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { status } = await getValidatedQuery(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return {
    count: await repository.countFeeds(userId, status),
  };
});
