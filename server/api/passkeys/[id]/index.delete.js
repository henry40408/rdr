// @ts-checks

import { z } from "zod";

const schema = z.object({
  id: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { id } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  await repository.deletePasskeyById(userId, id);

  setResponseStatus(event, 204);
});
