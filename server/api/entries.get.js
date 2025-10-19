import { z } from "zod";

/**
 * @typedef EntryEntityWithFeed
 * @property {CategoryEntity} category
 * @property {EntryEntity} entry
 * @property {FeedEntity} feed
 */

const schema = z.object({
  direction: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(1000).default(100),
  search: z.string().optional(),
  offset: z.coerce.number().min(0).default(0),
  order: z.enum(["date"]).default("date"),
  selectedId: z.coerce.number().optional(),
  selectedType: z.enum(["category", "feed"]).optional(),
  status: z.enum(["all", "read", "unread", "starred"]).default("all"),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { direction, limit, offset, order, search, selectedId, selectedType, status } = await getValidatedQuery(
    event,
    (query) => schema.parse(query),
  );

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const categories = await repository.findCategoriesWithFeed(userId);

  /** @type {number[]|undefined} */
  let feedIds = undefined;
  if (selectedType === "category" && selectedId) {
    const category = categories.find((c) => c.id === selectedId);
    feedIds = category?.feeds.map((f) => f.id) ?? [];
  } else if (selectedType === "feed" && selectedId) {
    feedIds = [selectedId];
  }

  const entries = await repository.findEntries({
    userId,
    direction,
    feedIds,
    limit,
    offset,
    order,
    search,
    status,
  });
  return entries
    .map((entry) => {
      const category = categories.find((c) => c.feeds.some((f) => f.id === entry.feedId));
      const feed = categories.flatMap((c) => c.feeds).find((f) => f.id === entry.feedId);
      if (!category || !feed) return undefined;
      return { category, entry, feed };
    })
    .filter((e) => !!e);
});
