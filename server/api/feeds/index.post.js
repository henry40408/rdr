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

  try {
    const entity = new NewCategoryFeedEntity({
      title: body.categoryName,
      xmlUrl: body.xmlUrl,
      htmlUrl: body.htmlUrl,
    });
    return await repository.createFeed(userId, body.categoryName, entity);
  } catch (e) {
    if (e instanceof HTTPError) throw createError({ statusCode: 400, statusMessage: `Failed to fetch feed: ${e}` });
    throw e;
  }
});
