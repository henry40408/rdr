// @ts-check

import { z } from "zod";

const schema = z.object({
  feedId: z.coerce.number(),
});

const bodySchema = z.object({
  categoryName: z.string(),
  title: z.string(),
  xmlUrl: z.url(),
  htmlUrl: z.url().or(z.literal("")),
  disableHttp2: z.boolean().optional(),
  userAgent: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const { feedId } = await getValidatedRouterParams(event, (params) => schema.parse(params));
  const { categoryName, title, xmlUrl, htmlUrl, disableHttp2, userAgent } = await readValidatedBody(event, (body) =>
    bodySchema.parse(body),
  );

  const feed = await repository.findFeedById(userId, feedId);
  if (!feed) throw createError({ statusCode: 404, statusMessage: "Feed not found" });

  const entity = new FeedEntity({
    id: feed.id,
    categoryId: feed.categoryId,
    title,
    xmlUrl,
    htmlUrl,
    disableHttp2: disableHttp2 ?? feed.disableHttp2,
    userAgent: userAgent ?? feed.userAgent,
  });
  await repository.updateFeed(userId, categoryName, entity);

  return entity;
});
