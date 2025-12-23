// @ts-check

import { z } from "zod";

const schema = z.union([
  z.object({
    kagiLanguage: z.string(),
    kagiSessionLink: z.union([z.url(), z.literal("")]),
  }),
  z.object({
    linkdingApiUrl: z.url(),
    linkdingApiToken: z.string(),
    linkdingDefaultTags: z.string(),
  }),
]);

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
