// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  return await repository.findUserSettings(userId);
});
