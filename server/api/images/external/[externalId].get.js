// @ts-check

import { secondsInHour, secondsInMinute } from "date-fns/constants";
import { z } from "zod";

const schema = z.object({
  externalId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { externalId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const image = await repository.findImageByExternalId(userId, externalId);
  if (!image) throw createError({ statusCode: 404, statusMessage: "Image not found" });

  if (image.etag) setHeader(event, "ETag", image.etag);
  if (image.lastModified) setHeader(event, "Last-Modified", image.lastModified);

  setHeader(event, "Cache-Control", `public, max-age=${secondsInHour}, stale-while-revalidate=${secondsInMinute}`);

  const etag = getHeader(event, "if-none-match");
  if (etag && image.etag && etag === image.etag) {
    setResponseStatus(event, 304);
    return;
  }

  const lastModified = getHeader(event, "if-modified-since");
  if (lastModified && image.lastModified && new Date(lastModified) >= new Date(image.lastModified)) {
    setResponseStatus(event, 304);
    return;
  }

  setHeader(event, "Content-Type", image.contentType);
  return image.blob;
});
