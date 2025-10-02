import { z } from "zod";

/**
 * @typedef PartialEntryWithFeed
 * @property {PartialEntryEntity} entry
 * @property {object} feed
 * @property {string} feed.id
 * @property {string} feed.title
 * @property {object} feed.category
 * @property {string} feed.category.id
 * @property {string} feed.category.name
 */

const schema = z.object({
  offset: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(100),
});

export default defineEventHandler(
  /** @returns {Promise<PartialEntryWithFeed[]>} */
  async (event) => {
    const { container } = useNitroApp();

    const query = await getValidatedQuery(event, (query) => schema.parse(query));

    /** @type {OpmlService} */
    const opmlService = container.resolve("opmlService");
    /** @type {Repository} */
    const repository = container.resolve("repository");

    const categories = opmlService.categories;
    const entries = await repository.listEntries({
      offset: query.offset,
      limit: query.limit,
    });
    return entries
      .map((entry) => {
        const category = categories.find((c) => c.feeds.some((f) => f.id === entry.feedId));
        const feed = categories.flatMap((c) => c.feeds).find((f) => f.id === entry.feedId);
        if (!category || !feed) return null;
        return {
          entry,
          feed: {
            id: feed.id,
            title: feed.title,
            category: {
              id: category.id,
              name: category.name,
            },
          },
        };
      })
      .filter((e) => !!e);
  },
);
