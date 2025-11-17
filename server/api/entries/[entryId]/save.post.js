// @ts-check

import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");
  /** @type {LinkdingService} */
  const linkdingService = container.resolve("linkdingService");

  const entry = await repository.findEntryById(userId, entryId);
  if (!entry) throw createError({ statusCode: 404, message: "Entry not found" });

  let content = await repository.findEntryContentById(userId, entryId);
  if (!content) content = "";

  /** @type {Promise<string|undefined>[]} */
  const tasks = [];
  tasks.push(
    linkdingService.save({
      userId,
      url: entry.link,
      title: entry.title,
      description: content,
    }),
  );

  const saved = await Promise.allSettled(tasks);
  return { saved: saved.filter((r) => r.status === "fulfilled").length };
});
