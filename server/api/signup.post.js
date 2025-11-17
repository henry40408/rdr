// @ts-check

import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();
  const config = useRuntimeConfig();

  if (config.disableSignUp) throw createError({ status: 503, message: "Sign ups are disabled" });

  const body = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  if (config.singleUser) {
    const count = await repository.countUsers();
    if (count > 0) throw createError({ statusCode: 409, statusMessage: "User already exists" });
  }

  const user = new UserEntity({ id: 0, username: body.username, nonce: 0 });
  await repository.createUser(user, body.password);

  await setUserSession(event, { user: { id: user.id, username: user.username }, loggedInAt: new Date() });

  return { userId: user.id };
});
