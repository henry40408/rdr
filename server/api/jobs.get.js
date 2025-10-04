export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {JobService} */
  const jobService = container.resolve("jobService");

  return jobService.jobs.map((job) => ({
    name: job.name,
    description: job.description,
    lastDate: job.inner.lastDate(),
    nextDate: job.inner.nextDate(),
  }));
});
