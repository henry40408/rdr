import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { name } = await getValidatedRouterParams(event, (query) => schema.parse(query));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const user = await repository.findUserById(userId);
  if (!user?.isAdmin) throw createError({ status: 403, message: "Forbidden" });

  const jobs = await repository.findJobs();
  const job = jobs.find((j) => j.name === name);
  if (!job) throw createError({ status: 404, message: "Job not found" });

  const pausedAt = job.pausedAt ? undefined : new Date().toISOString();
  job.pausedAt = pausedAt;
  await repository.upsertJob(job);

  return { success: true, pausedAt };
});
