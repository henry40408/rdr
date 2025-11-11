// @ts-check

export default defineEventHandler(async () => {
  const { container } = useNitroApp();

  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  try {
    await repository.knex.raw("SELECT 1");
    return { status: "ok" };
  } catch (error) {
    logger.error(error);
    logger.error("Health check failed");
    throw createError({ statusCode: 500, statusMessage: "Health check failed" });
  }
});
