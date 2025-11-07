// @ts-check

import { z } from "zod";

const schema = z.object({
  categoryId: z.coerce.number(),
});

const bodySchema = z.object({
  name: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { categoryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));
  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const category = new CategoryEntity({
    id: categoryId,
    userId: userId,
    name: body.name,
  });
  await repository.updateCategory(userId, category);

  return category;
});
