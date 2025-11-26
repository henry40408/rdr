// @ts-check

import { z } from "zod";

const schema = z.object({
  categoryName: z.string(),
  xmlUrl: z.url(),
  htmlUrl: z.url().optional(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const body = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const discovered = await feedService.discoverFeed(body.xmlUrl);
  if (!discovered) throw createError({ statusCode: 400, message: "Unable to discover feed from the provided URL." });

  const { xmlUrl, meta } = discovered;
  const title = meta?.title;
  if (!title) throw createError({ statusCode: 400, message: "Unable to discover feed title from the provided URL." });

  const htmlUrl = body.htmlUrl ?? meta?.link;
  if (!htmlUrl)
    throw createError({ statusCode: 400, message: "Unable to discover feed HTML URL from the provided URL." });

  const entity = new NewCategoryFeedEntity({ title, xmlUrl, htmlUrl });
  return await repository.createFeed(userId, body.categoryName, entity);
});
