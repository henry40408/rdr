export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const jobName = getRouterParam(event, "name");
  if (!jobName) throw createError({ statusCode: 400, message: "Job name is required" });

  /** @type {JobService} */
  const jobService = container.resolve("jobService");
  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");

  jobService.run(jobName).catch((err) => {
    logger.error(`Failed to run job ${jobName}: ${err.message}`);
  });

  return true;
});
