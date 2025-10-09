import { z } from "zod";

const schema = z.object({
  search: z.string().nullable().optional(),
  selectedId: z.string().optional(),
  selectedType: z.enum(["category", "feed"]).optional(),
  status: z.enum(["all", "read", "unread"]).default("all"),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { search, selectedId, selectedType, status } = await getValidatedQuery(event, (query) => schema.parse(query));

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  /** @type {string[]|undefined} */
  let feedIds = undefined;
  if (selectedType === "category" && selectedId) {
    const category = opmlService.categories.find((c) => c.id === selectedId);
    feedIds = category?.feeds.map((f) => f.id) || [];
  } else if (selectedType === "feed" && selectedId) {
    feedIds = [selectedId];
  }

  return {
    count: await repository.countEntries({ feedIds, search: search || undefined, status }),
  };
});
