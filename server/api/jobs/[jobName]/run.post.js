import { z } from "zod";

const schema = z.object({
  jobName: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { jobName } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  /** @type {JobService} */
  const jobService = container.resolve("jobService");
  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");

  jobService.run(jobName).catch((err) => {
    logger.error(`Failed to run job ${jobName}: ${err.message}`);
  });

  return true;
});
