import { z } from "zod";

const schema = z.object({
  categoryId: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { categoryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  await repository.deleteCategory(userId, categoryId);

  setResponseStatus(event, 204);
});
