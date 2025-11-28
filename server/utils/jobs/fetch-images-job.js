// @ts-check

import { BaseJob } from "./base-job.js";
import PQueue from "p-queue";
import os from "node:os";

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

    this.queue = new PQueue({ concurrency: os.cpus().length });
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
      const tasks = [];
      for (const feed of feeds) {
        tasks.push(
          this.queue.add(async () => {
            this.logger.debug({ msg: "Fetching image for feed", feedId: feed.id });
            try {
              await this.feedService.fetchImage(user.id, feed);
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
      }
      await Promise.allSettled(tasks);
    }

    logger.info("Completed feed images job");
  }
}
