// @ts-check

import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  await clearUserSession(event); // clear any existing session

  const body = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.authenticate(body.username, body.password);
  if (!user) throw createError({ statusCode: 401, statusMessage: "Invalid username or password" });

  await setUserSession(event, {
    user: { id: user.id, username: user.username, nonce: user.nonce },
    loggedInAt: new Date().toISOString(),
  });

  return { userId: user.id };
});
