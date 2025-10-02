import { CronJob } from "cron";

export const FETCH_ENTRIES_JOB = "job:fetch-entries";

export class JobService {
  /**
   * @param {object} opts
   * @param {FeedService} opts.feedService
   * @param {import('pino').Logger} opts.logger
   * @param {OpmlService} opts.opmlService
   */
  constructor({ feedService, logger, opmlService }) {
    this.feedService = feedService;
    this.logger = logger;
    this.opmlService = opmlService;

    /** @type {Map<string,CronJob>} */
    this.jobs = new Map();
    /** @type {Map<string,Function>} */
    this.funcs = new Map();
  }

  init() {
    this._initJobs();
    for (const [name, job] of this.jobs) {
      job.start();
      this.logger.info(`Started job: ${name}`);
    }
  }

  dispose() {
    for (const [name, job] of this.jobs) {
      job.stop();
      this.logger.info(`Stopped job: ${name}`);
    }
  }

  /**
   * @param {string} name
   */
  async runJob(name) {
    switch (name) {
      case FETCH_ENTRIES_JOB:
        return await this._fetchEntries();
      default:
        this.logger.warn(`Unknown job requested: ${name}`);
    }
  }

  _initJobs() {
    {
      const job = CronJob.from({
        cronTime: "0 0 * * * *", // every hour
        onTick: this._fetchEntries,
        waitForCompletion: true,
      });
      this.jobs.set(FETCH_ENTRIES_JOB, job);
      this.logger.info("Initialized feed refresh job");
    }
  }

  async _fetchEntries() {
    const logger = this.logger.child({ job: FETCH_ENTRIES_JOB });

    logger.info("Starting feed refresh job");
    const feeds = this.opmlService.categories.flatMap((c) => c.feeds);
    const tasks = feeds.map((feed) =>
      Promise.all([this.feedService.fetchAndSaveEntries(feed), this.feedService.fetchImage(feed)]),
    );
    await Promise.allSettled(tasks);
    logger.info("Completed feed refresh job");
  }
}
