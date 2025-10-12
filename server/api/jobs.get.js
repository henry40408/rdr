export default defineEventHandler(async () => {
  const { container } = useNitroApp();

  /** @type {JobService} */
  const jobService = container.resolve("jobService");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const entities = await repository.findJobs();
  return jobService.jobs.map((job) => {
    const entity = entities.find((e) => e.name === job.name);
    return {
      name: job.name,
      description: job.description,
      lastDate: entity?.lastDate,
      lastDurationMs: entity?.lastDurationMs,
      lastError: entity?.lastError,
    };
  });
});
