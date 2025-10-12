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
  }

  get name() {
    return "job:fetch-images";
  }

  get description() {
    return "Fetches images from all feeds";
  }

  async run() {
    const logger = this.logger.child({ job: this.name });

    let counter = 0;
    logger.info("Starting feed images job");

    const feeds = await this.repository.findFeeds();
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
