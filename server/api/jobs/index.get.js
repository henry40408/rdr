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

  /** @type {(JobEntity & { description: string })[]} */
  const jobs = [];
  if (!user?.isAdmin) return { jobs };

  const entities = await repository.findJobs();
  for (const entity of entities) {
    const job = jobService.jobs.find((j) => j.name === entity.name);
    if (!job) continue;
    jobs.push({ ...entity, description: job.description });
  }

  return { jobs };
});
