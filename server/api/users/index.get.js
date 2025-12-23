// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user?.isAdmin) {
    const user = await repository.findUserById(userId);
    if (user) return { users: [user] }; // Non-admins can only see their own user info
    return { users: [] };
  }

  const users = await repository.findUsers();
  return { users };
});
