// @ts-check

import { z } from "zod";

const schema = z.xor([
  z.object({
    kagiLanguage: z.string(),
    kagiSessionLink: z.union([z.url(), z.literal("")]),
  }),
  z.object({
    linkdingApiUrl: z.union([z.url(), z.literal("")]),
    linkdingApiToken: z.string(),
    linkdingDefaultTags: z.array(z.string()).transform((tags) => JSON.stringify(tags)),
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
