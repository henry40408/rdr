// @ts-check

import { HTTPError } from "got";
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

  /** @type {Repository} */
  const repository = container.resolve("repository");
  /** @type {FeedService} */
  const feedService = container.resolve("feedService");

  const entity = new FeedEntity({
    id: 0,
    categoryId: 0,
    title: "",
    xmlUrl: body.xmlUrl,
    htmlUrl: body.htmlUrl || "",
  });
  try {
    const fetched = await feedService.fetchEntries(entity);
    entity.title = fetched.meta?.title || "(No title)";

    const created = await repository.createFeed(userId, body.categoryName, entity);
    return await repository.findFeedById(userId, created.id);
  } catch (e) {
    if (e instanceof HTTPError) throw createError({ statusCode: 400, statusMessage: `Failed to fetch feed: ${e}` });
    throw e;
  }
});
