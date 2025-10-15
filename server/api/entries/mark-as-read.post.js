import z from "zod";

const schema = z.object({
  search: z.string().optional(),
  selectedId: z.coerce.number(),
  selectedType: z.enum(["feed", "category"]),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { search, selectedType, selectedId } = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const categories = await repository.findCategoriesWithFeed();

  /** @type {number[]} */
  let feedIds = [];
  if (selectedType === "category" && selectedId) {
    const category = categories.find((c) => c.id === selectedId);
    feedIds = category?.feeds.map((f) => f.id) || [];
  } else if (selectedType === "feed" && selectedId) {
    feedIds = [selectedId];
  }
  await repository.markEntriesAsRead({ feedIds, search });

  return {};
});
