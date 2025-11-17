// @ts-check

import { z } from "zod";

const schema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
  });

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { currentPassword, newPassword } = await readValidatedBody(event, (body) => schema.parse(body));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user) throw createError({ statusCode: 404, statusMessage: "User not found" });

  const updated = await repository.updateUserPassword(user.username, currentPassword, newPassword);
  if (!updated) throw createError({ statusCode: 401, statusMessage: "Current password is incorrect" });

  {
    const user = await repository.findUserById(userId);
    if (!user) throw createError({ statusCode: 404, statusMessage: "User not found" });
    await replaceUserSession(event, {
      user: {
        id: user.id,
        username: user.username,
        nonce: user.nonce,
      },
      loggedInAt: new Date(),
    });
  }

  return { status: "COMPLETED" };
});
