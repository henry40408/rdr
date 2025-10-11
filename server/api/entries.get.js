import { z } from "zod";

/**
 * @typedef EntryEntityWithFeed
 * @property {EntryEntity} entry
 * @property {object} feed
 * @property {string} feed.id
 * @property {string} feed.title
 * @property {object} feed.category
 * @property {string} feed.category.id
 * @property {string} feed.category.name
 */

const selectedFeed = z.object({
  type: z.literal("feed"),
  id: z.string(),
});

const schema = z.object({
  limit: z.coerce.number().min(1).max(100).default(100),
  search: z.string().optional(),
  offset: z.coerce.number().min(0).default(0),
  selectedId: z.string().optional(),
  selectedType: z.enum(["category", "feed"]).optional(),
  status: z.enum(["all", "read", "unread"]).default("all"),
});

export default defineEventHandler(
  /** @returns {Promise<EntryEntityWithFeed[]>} */
  async (event) => {
    const { container } = useNitroApp();

    const { limit, offset, search, selectedId, selectedType, status } = await getValidatedQuery(event, (query) =>
      schema.parse(query),
    );

    /** @type {OpmlService} */
    const opmlService = container.resolve("opmlService");
    /** @type {Repository} */
    const repository = container.resolve("repository");

    const categories = opmlService.categories;

    /** @type {string[]|undefined} */
    let feedIds = undefined;
    if (selectedType === "category" && selectedId) {
      const category = categories.find((c) => c.id === selectedId);
      feedIds = category?.feeds.map((f) => f.id) || [];
    } else if (selectedType === "feed" && selectedId) {
      feedIds = [selectedId];
    }

    const entries = await repository.listEntries({
      feedIds,
      limit,
      offset,
      search,
      status,
    });
    return entries
      .map((entry) => {
        const category = categories.find((c) => c.feeds.some((f) => f.id === entry.feedId));
        const feed = categories.flatMap((c) => c.feeds).find((f) => f.id === entry.feedId);
        if (!category || !feed) return undefined;
        return {
          entry,
          feed: {
            id: feed.id,
            title: feed.title.trim(),
            category: {
              id: category.id,
              name: category.name.trim(),
            },
          },
        };
      })
      .filter((e) => !!e);
  },
);
