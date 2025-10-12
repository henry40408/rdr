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
        await this.repository.upsertJob(job.name);
        await job.init();
        this.logger.info({ msg: "Registered job", job: job.name });
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
    const now = new Date();
    const name = job.name;
    try {
      await job.run();
      const elapsed = Date.now() - now.valueOf();
      await this.repository.upsertJobExecution(name, elapsed, null);
    } catch (err) {
      const elapsed = Date.now() - now.valueOf();
      await this.repository.upsertJobExecution(name, elapsed, `${err}`);
    }
  }
}
