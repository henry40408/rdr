import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { name } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  /** @type {JobService} */
  const jobService = container.resolve("jobService");
  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");

  jobService.runByName(name).catch((err) => {
    logger.error(`Failed to run job ${name}: ${err}`);
  });

  return true;
});
