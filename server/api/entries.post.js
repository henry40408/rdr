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

const selectedCategory = z.object({
  type: z.literal("category"),
  id: z.string(),
});

const selectedFeed = z.object({
  type: z.literal("feed"),
  id: z.string(),
});

const schema = z.object({
  selected: z.union([selectedCategory, selectedFeed]).optional(),
  limit: z.coerce.number().min(1).max(100).default(100),
  search: z.string().optional(),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(["all", "read", "unread"]).default("all"),
});

export default defineEventHandler(
  /** @returns {Promise<EntryEntityWithFeed[]>} */
  async (event) => {
    const { container } = useNitroApp();

    const body = await readValidatedBody(event, (body) => schema.parse(body));

    /** @type {OpmlService} */
    const opmlService = container.resolve("opmlService");
    /** @type {Repository} */
    const repository = container.resolve("repository");

    const categories = opmlService.categories;

    /** @type {string[]|undefined} */
    let feedIds = undefined;
    const selected = body.selected;
    if (selected) {
      if (selected.type === "category") {
        const category = categories.find((c) => c.id === selected.id);
        feedIds = category?.feeds.map((f) => f.id) || [];
      } else if (selected.type === "feed") {
        feedIds = [selected.id];
      }
    }

    const entries = await repository.listEntries({
      feedIds,
      limit: body.limit,
      offset: body.offset,
      search: body.search,
      status: body.status,
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
