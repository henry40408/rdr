// @ts-check

import { BaseJob } from "./base-job.js";
import PQueue from "p-queue";
import os from "node:os";

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

    this.queue = new PQueue({ concurrency: os.cpus().length });
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
      const tasks = [];
      for (const feed of feeds) {
        if (feed.errorCount > errorThreshold) continue;
        tasks.push(
          this.queue.add(async () => {
            this.logger.debug({ msg: "Fetching entries for feed", feedId: feed.id });
            try {
              await this.feedService.fetchAndSaveEntries(user.id, feed);
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
      }
      await Promise.allSettled(tasks);
    }

    logger.info("Completed feed refresh job");
  }
}
