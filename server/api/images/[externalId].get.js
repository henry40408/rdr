import { z } from "zod";

const schema = z.object({
  externalId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const userId = getUserIdOrThrow(event);
  const { externalId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const image = await repository.findImageByExternalId(userId, externalId);
  if (!image) throw createError({ statusCode: 404, statusMessage: "Image not found" });

  event.node.res.setHeader("Content-Type", image.contentType);
  return image.blob;
});
