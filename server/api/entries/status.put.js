import { z } from "zod";

const schema = z.object({
  entryIds: z.coerce.number().array().min(1),
  status: z.enum(["read", "unread", "starred", "unstarred"]),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { entryIds, status } = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const updated = await repository.updateEntriesStatus(userId, entryIds, status);
  return { updated };
});
