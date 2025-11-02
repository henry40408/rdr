import { z } from "zod";

const schema = z.object({
  feedId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const { feedId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  const feed = await repository.findFeedById(userId, feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  await repository.deleteFeed(userId, feedId);

  return "";
});
