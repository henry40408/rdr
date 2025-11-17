// @ts-check

import z from "zod";

const schema = z.object({
  before: z.iso.datetime({ offset: true }).optional(),
  olderThan: z.enum(["day", "week", "month", "year"]).optional(),
  search: z.string().optional(),
  selectedId: z.coerce.number().optional(),
  selectedType: z.enum(["feed", "category"]).optional(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { before, olderThan, search, selectedType, selectedId } = await readValidatedBody(event, (body) =>
    schema.parse(body),
  );

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const categories = await repository.findCategoriesWithFeed(userId);

  /** @type {number[]} */
  let feedIds = [];
  if (selectedType === "category" && selectedId) {
    const category = categories.find((c) => c.id === selectedId);
    feedIds = category?.feeds.map((f) => f.id) ?? [];
  } else if (selectedType === "feed" && selectedId) {
    feedIds = [selectedId];
  }

  const updated = await repository.markEntriesAsRead({ before, userId, feedIds, olderThan, search });
  return { updated };
});
