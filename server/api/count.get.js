import { z } from "zod";

const schema = z.object({
  search: z.string().nullable().optional(),
  selectedId: z.coerce.number().optional(),
  selectedType: z.enum(["category", "feed"]).optional(),
  status: z.enum(["all", "read", "unread", "starred"]).default("all"),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { search, selectedId, selectedType, status } = await getValidatedQuery(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  /** @type {number[]|undefined} */
  let feedIds = undefined;
  if (selectedType === "category" && selectedId) {
    const feeds = await repository.findFeedsWithCategoryId(selectedId);
    feedIds = feeds.map((f) => f.id);
  } else if (selectedType === "feed" && selectedId) {
    feedIds = [selectedId];
  }

  return {
    count: await repository.countEntries({ feedIds, search: search || undefined, status }),
  };
});
