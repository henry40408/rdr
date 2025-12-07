import { z } from "zod";

const schema = z.object({
  id: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user.isAdmin) throw createError({ statusCode: 403, statusMessage: "Forbidden" });

  const { id } = await getValidatedRouterParams(event, (params) => schema.parse(params));
  if (userId === id) throw createError({ statusCode: 400, statusMessage: "Cannot toggle own user status" });

  await repository.toggleUser(id);

  return await repository.findUserById(id);
});
