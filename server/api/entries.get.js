import { z } from "zod";

/**
 * @typedef PartialEntryWithFeed
 * @property {import("../utils/entities").PartialEntry} entry
 * @property {object} feed
 * @property {string} feed.id
 * @property {string} feed.title
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

    /** @type {import("../utils/opml-service").OpmlService} */
    const opmlService = container.resolve("opmlService");
    /** @type {import("../utils/repository").Repository} */
    const repository = container.resolve("repository");

    const categories = opmlService.categories;
    const entries = await repository.listEntries({
      offset: query.offset,
      limit: query.limit,
    });
    return entries
      .map((entry) => {
        const feed = categories.flatMap((c) => c.feeds).find((f) => f.id === entry.feedId);
        if (!feed) return null;
        return {
          entry,
          feed: {
            id: feed.id,
            title: feed.title,
          },
        };
      })
      .filter((e) => !!e);
  },
);
