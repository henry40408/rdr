import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { name } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  /** @type {JobService} */
  const jobService = container.resolve("jobService");
  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user?.isAdmin) throw createError({ status: 403, message: "Forbidden" });

  jobService.runByName(name).catch((err) => {
    logger.error(`Failed to run job ${name}: ${err}`);
  });

  return true;
});
