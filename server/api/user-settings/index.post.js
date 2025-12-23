// @ts-check

import { z } from "zod";

const schema = z.record(
  z.enum([
    // Kagi
    "kagiLanguage",
    "kagiSessionLink",
    // Linkding
    "linkdingApiUrl",
    "linkdingApiToken",
    "linkdingDefaultTags",
  ]),
  z.string(),
);

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const settings = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  await repository.updateUserSettings(userId, settings);

  return settings;
});
