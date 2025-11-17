// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {JobService} */
  const jobService = container.resolve("jobService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user?.isAdmin) return [];

  const entities = await repository.findJobs();
  return jobService.jobs.map((job) => {
    const entity = entities.find((e) => e.name === job.name);
    return {
      name: job.name,
      description: job.description,
      pausedAt: entity?.pausedAt,
      lastDate: entity?.lastDate,
      lastDurationMs: entity?.lastDurationMs,
      lastError: entity?.lastError,
    };
  });
});
