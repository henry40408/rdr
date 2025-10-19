export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const settings = await repository.findUserSettings(userId);

  const summarization = !!settings.kagiSessionLink && !!settings.kagiLanguage;
  return {
    summarization,
  };
});
