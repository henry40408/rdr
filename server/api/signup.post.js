// @ts-check

import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();
  const config = useRuntimeConfig();

  if (config.disableSignUp) throw createError({ status: 503, statusMessage: "Sign ups are disabled" });

  const body = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  if (config.singleUser) {
    const count = await repository.countUsers();
    if (count > 0) throw createError({ statusCode: 409, statusMessage: "User already exists" });
  }

  const user = new UserEntity({ id: 0, username: body.username, nonce: 0 });

  const created = await repository.createUser(user, body.password);
  await setUserSession(event, {
    user: { id: created.id, username: created.username, nonce: created.nonce },
    loggedInAt: new Date(),
  });

  return { userId: created.id };
});
