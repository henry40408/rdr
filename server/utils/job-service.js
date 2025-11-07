// @ts-check

export class JobService {
  /**
   * @param {object} opts
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ logger, repository }) {
    this.logger = logger.child({ context: "job-service" });
    this.repository = repository;

    /** @type {BaseJob[]} */
    this.jobs = [];
  }

  async init() {
    const tasks = [];
    for (const job of this.jobs) {
      const task = async () => {
        await this.repository.registerJob(job.name);
        await job.init();
      };
      tasks.push(task());
    }
    await Promise.all(tasks);
  }

  async dispose() {
    const tasks = [];
    for (const job of this.jobs) {
      const task = async () => {
        await job.dispose();
        this.logger.info({ msg: "Disposed job", job: job.name });
      };
      tasks.push(task());
    }
    await Promise.all(tasks);
  }

  /**
   * @param {BaseJob} job
   */
  register(job) {
    if (!this.jobs.some((j) => j.name === job.name)) this.jobs.push(job);
  }

  /**
   * @param {string} name
   */
  async runByName(name) {
    const job = this.jobs.find((j) => j.name === name);
    if (!job) {
      this.logger.warn(`Job ${name} not found`);
      return;
    }
    await this.run(job);
  }

  /**
   * @param {BaseJob} job
   */
  async run(job) {
    const logger = this.logger.child({ jobName: job.name });

    const now = new Date();
    const name = job.name;

    const entity = await this.repository.findJobByName(name);
    if (!entity) throw new Error(`Job entity for ${name} not found`);

    if (entity.pausedAt) {
      logger.info(`Job ${name} is paused, skipping execution`);
      return;
    }

    try {
      await job.run();

      entity.lastDate = now.toISOString();
      entity.lastDurationMs = Date.now() - now.valueOf();
      entity.lastError = undefined;

      await this.repository.upsertJob(entity).catch((error) => {
        logger.error({ msg: "Failed to record job execution", name, error });
      });
    } catch (err) {
      entity.lastDate = now.toISOString();
      entity.lastError = `${err}`;

      await this.repository.upsertJob(entity).catch((error) => {
        logger.error({ msg: "Failed to record job execution failure", name, error });
      });
    }
  }
}
