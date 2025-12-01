// @ts-check

import { BaseJob } from "./base-job.js";
import PQueue from "p-queue";
import { getMinutes } from "date-fns";
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
      cronTime: "10 * * * * *", // every minute at 10 seconds
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
    const bucket = getMinutes(new Date());
    const logger = this.logger.child({ job: this.name });

    let counter = 0;
    logger.info({ msg: "Starting feed images job", bucket });

    const users = await this.repository.findUsers();
    for (const user of users) {
      const feeds = await this.repository.findFeedsByBucket(user.id, bucket);
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

    logger.info({ msg: "Finished feed images job", bucket });
  }
}
