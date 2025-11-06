import { z } from "zod";

const schema = z.object({
  feedId: z.coerce.number(),
});

const bodySchema = z.object({
  title: z.string(),
  xmlUrl: z.url(),
  htmlUrl: z.url().or(z.literal("")),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const { feedId } = await getValidatedRouterParams(event, (params) => schema.parse(params));
  const body = await readBody(event);
  const { title, xmlUrl, htmlUrl } = bodySchema.parse(body);

  const feed = await repository.findFeedById(userId, feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  const entity = new FeedEntity({
    id: feed.id,
    categoryId: feed.categoryId,
    title,
    xmlUrl,
    htmlUrl,
  });
  await repository.updateFeed(userId, entity);

  return entity;
});
