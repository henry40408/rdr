import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string(),
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

  const user = new UserEntity({ id: 0, username: body.username });
  await repository.createUser(user, body.password);

  return { userId: user.id };
});
