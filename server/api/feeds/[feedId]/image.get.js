import { z } from "zod";

const schema = z.object({
  feedId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {FeedService} */
  const feedService = container.resolve("feedService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const { feedId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  const image = await repository.findImageByExternalId(buildFeedImageKey(feedId));
  if (!image) throw createError({ statusCode: 404, statusMessage: "Feed image not found" });

  event.node.res.setHeader("Content-Type", image.contentType);
  return image.blob;
});
