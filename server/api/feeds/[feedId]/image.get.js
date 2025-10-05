import { z } from "zod";

const schema = z.object({
  feedId: z.string(),
});

export default defineCachedEventHandler(
  async (event) => {
    const { container } = useNitroApp();

    /** @type {Repository} */
    const repository = container.resolve("repository");

    const { feedId } = await getValidatedRouterParams(event, (query) => schema.parse(query));

    const image = await repository.findImageByExternalId(buildFeedImageExternalId(feedId));
    if (!image) throw createError({ statusCode: 404, statusMessage: "Feed image not found" });

    event.node.res.setHeader("Content-Type", image.contentType);
    return image.blob;
  },
  {
    maxAge: 60 * 60 * 24 * 365.25, // 1 year
  },
);
