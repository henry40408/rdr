export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {import("../../../utils/repository").Repository} */
  const repository = container.resolve("repository");

  const feedId = getRouterParam(event, "feedId");
  if (!feedId) throw createError({ statusCode: 400, statusMessage: "feedId is required" });

  const image = await repository.findFeedImageByFeedId(feedId);
  if (!image) throw createError({ statusCode: 404, statusMessage: "Feed image not found" });

  event.node.res.setHeader("Content-Type", image.contentType);
  event.node.res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
  return image.blob;
});
