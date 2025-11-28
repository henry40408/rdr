// @ts-check

import { BaseJob } from "./base-job.js";

/** @implements {BaseJob} */
export class FetchImagesJob extends BaseJob {
  /**
   * @param {object} opts
   * @param {FeedService} opts.feedService
   * @param {JobService} opts.jobService
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ feedService, jobService, logger, repository }) {
    super({
      cronTime: "0 10 * * * *", // every hour at minute 10
      jobService,
    });

    this.feedService = feedService;
    this.jobService = jobService;
    this.logger = logger;
    this.repository = repository;

    this.BATCH_SIZE = 5;
  }

  /** @override */
  get name() {
    return "job:fetch-images";
  }

  /** @override */
  get description() {
    return "Fetches images from all feeds";
  }

  /** @override */
  async run() {
    const logger = this.logger.child({ job: this.name });

    let counter = 0;
    logger.info("Starting feed images job");

    const users = await this.repository.findUsers();
    for (const user of users) {
      const categories = await this.repository.findCategoriesWithFeed(user.id);
      const feeds = categories.flatMap((category) => category.feeds);
      for (let i = 0; i < feeds.length; i += this.BATCH_SIZE) {
        const feedBatch = feeds.slice(i, i + this.BATCH_SIZE);

        await Promise.allSettled(
          feedBatch.map(async (feed) => {
            try {
              return await this.feedService.fetchImage(user.id, feed);
            } finally {
              this.logger.debug({
                msg: "Fetched image for feed",
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

    logger.info("Completed feed images job");
  }
}
