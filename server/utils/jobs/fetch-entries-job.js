// @ts-check

import { BaseJob } from "./base-job.js";

export class FetchEntriesJob extends BaseJob {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {FeedService} opts.feedService
   * @param {JobService} opts.jobService
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ config, feedService, jobService, logger, repository }) {
    super({
      cronTime: "0 0 * * * *", // every hour
      jobService,
    });
    this.config = config;
    this.feedService = feedService;
    this.logger = logger;
    this.repository = repository;

    this.BATCH_SIZE = 3;
  }

  /** @override */
  get name() {
    return "job:fetch-entries";
  }

  /** @override */
  get description() {
    return "Fetches new entries from all feeds";
  }

  /** @override */
  async run() {
    const { errorThreshold } = this.config;
    const logger = this.logger.child({ job: this.name });

    let counter = 0;
    logger.info("Starting feed refresh job");

    const users = await this.repository.findUsers();
    for (const user of users) {
      const categories = await this.repository.findCategoriesWithFeed(user.id);
      const feeds = categories.flatMap((category) => category.feeds);
      for (let i = 0; i < feeds.length; i += this.BATCH_SIZE) {
        const feedBatch = feeds
          .slice(i, i + this.BATCH_SIZE)
          // only fetch feeds whose error count is below error threshold
          .filter((f) => f.errorCount < errorThreshold);

        await Promise.allSettled(
          feedBatch.map(async (feed) => {
            try {
              return await this.feedService.fetchAndSaveEntries(user.id, feed);
            } finally {
              this.logger.debug({
                msg: "Fetched entries for feed",
                feedId: feed.id,
                counter: ++counter,
                total: feeds.length,
              });
            }
          }),
        );

        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    logger.info("Completed feed refresh job");
  }
}
