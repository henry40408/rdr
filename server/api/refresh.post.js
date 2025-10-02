export default defineEventHandler(async () => {
  const { container } = useNitroApp();

  /** @type {JobService} */
  const jobService = container.resolve("jobService");

  await jobService.runJob(FETCH_ENTRIES_JOB);

  return true;
});
