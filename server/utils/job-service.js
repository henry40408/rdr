import { CronJob } from "cron";

export const FETCH_ENTRIES_JOB = "job:fetch-entries";
export const FETCH_FEED_IMAGES_JOB = "job:fetch-feed-images";

export class JobWithMetadata {
  /**
   * @param {object} opts
   * @param {string} opts.cronTime
   * @param {() => Promise<void>} opts.onTick
   * @param {string} opts.name
   * @param {string} opts.description
   */
  constructor({ cronTime, onTick, name, description }) {
    this.name = name;
    this.description = description;
    this.onTick = onTick;

    /** @type {Date | undefined} */
    this._lastDate = undefined;

    this.inner = CronJob.from({
      cronTime,
      onTick,
      waitForCompletion: true,
    });
  }

  /** @returns {Date | undefined} */
  get lastDate() {
    const lastDate = this.inner.lastDate();
    if (lastDate && this._lastDate && lastDate > this._lastDate) return lastDate;
    return this._lastDate;
  }

  async run() {
    const res = await this.onTick();
    this._lastDate = new Date();
    return res;
  }

  start() {
    this.inner.start();
  }

  async stop() {
    await this.inner.stop();
  }
}

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

    /** @type {JobWithMetadata[]} */
    this.jobs = [];
  }

  init() {
    this._initJobs();
    for (const job of this.jobs) {
      job.start();
      this.logger.info(`Started job: ${job.name}`);
    }
  }

  dispose() {
    for (const job of this.jobs) {
      job.stop();
      this.logger.info(`Stopped job: ${job.name}`);
    }
  }

  /**
   * @param {string} name
   */
  async run(name) {
    const job = this.jobs.find((j) => j.name === name);
    if (!job) throw new Error(`Job not found: ${name}`);

    this.logger.info(`Manually triggering job: ${name}`);
    await job.run();
    this.logger.info(`Completed manual trigger of job: ${name}`);
  }

  _initJobs() {
    {
      const job = new JobWithMetadata({
        cronTime: "0 0 * * * *", // every hour
        onTick: () => this._fetchEntries(),
        name: FETCH_ENTRIES_JOB,
        description: "Fetch entries from all feeds",
      });
      this.jobs.push(job);
      this.logger.info("Initialized feed refresh job");
    }
    {
      const job = new JobWithMetadata({
        cronTime: "0 0 0 * * *", // every day
        onTick: () => this._fetchFeedImages(),
        name: FETCH_FEED_IMAGES_JOB,
        description: "Fetch images for all feeds",
      });
      this.jobs.push(job);
      this.logger.info("Initialized feed images job");
    }
  }

  async _fetchEntries() {
    const logger = this.logger.child({ job: FETCH_ENTRIES_JOB });

    let counter = 0;
    logger.info("Starting feed refresh job");

    const feeds = this.opmlService.categories.flatMap((c) => c.feeds);
    const tasks = feeds.map((feed) =>
      Promise.allSettled([this.feedService.fetchAndSaveEntries(feed), this.feedService.fetchImage(feed)]).finally(
        () => {
          this.logger.debug({
            msg: "Fetched entries for feed",
            feedId: feed.id,
            counter: ++counter,
            total: feeds.length,
          });
        },
      ),
    );
    await Promise.allSettled(tasks);
    logger.info("Completed feed refresh job");
  }

  async _fetchFeedImages() {
    const logger = this.logger.child({ job: FETCH_FEED_IMAGES_JOB });

    let counter = 0;
    logger.info("Starting feed images job");

    const feeds = this.opmlService.categories.flatMap((c) => c.feeds);
    const tasks = feeds.map((feed) =>
      this.feedService.fetchImage(feed).finally(() => {
        this.logger.debug({
          msg: "Fetched image for feed",
          feedId: feed.id,
          counter: ++counter,
          total: feeds.length,
        });
      }),
    );
    await Promise.allSettled(tasks);
    logger.info("Completed feed images job");
  }
}
