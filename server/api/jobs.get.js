export default defineEventHandler(async () => {
  const { container } = useNitroApp();

  /** @type {JobService} */
  const jobService = container.resolve("jobService");

  return jobService.jobs.map((job) => ({
    name: job.name,
    description: job.description,
    lastDate: job.lastDate?.toISOString(),
    nextDate: job.inner.nextDate(),
  }));
});
