export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Entry ID is required" });

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const now = await repository.toggleEntry(id);
  return { success: true, readAt: now };
});
