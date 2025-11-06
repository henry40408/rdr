// @ts-check

import { z } from "zod";

const schema = z.record(z.string(), z.string());

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const settings = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  await repository.updateUserSettings(userId, settings);

  return settings;
});
