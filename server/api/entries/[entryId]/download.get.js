import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");
  /** @type {DownloadService} */
  const downloadService = container.resolve("downloadService");

  const entry = await repository.findEntryById(entryId);
  if (!entry) throw createError({ statusCode: 404, statusMessage: "Entry not found" });
  if (!entry.link) throw createError({ statusCode: 400, statusMessage: "Entry has no link" });

  const res = await downloadService.downloadText({ url: entry.link });
  if (!res) throw createError({ statusCode: 400, statusMessage: "Failed to download entry content" });

  const doc = new JSDOM(res.body, { url: entry.link });
  const reader = new Readability(doc.window.document);
  return reader.parse();
});
