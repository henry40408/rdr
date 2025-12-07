export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user?.isAdmin) return [];

  return await repository.findUsers();
});
