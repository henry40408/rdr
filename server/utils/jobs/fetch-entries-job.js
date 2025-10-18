import { BaseJob } from "./base-job.js";

export class FetchEntriesJob extends BaseJob {
  /**
   * @param {object} opts
   * @param {FeedService} opts.feedService
   * @param {JobService} opts.jobService
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ feedService, jobService, logger, repository }) {
    super({
      cronTime: "0 0 * * * *", // every hour
      jobService,
    });
    this.feedService = feedService;
    this.logger = logger;
    this.repository = repository;
  }

  get name() {
    return "job:fetch-entries";
  }

  get description() {
    return "Fetches new entries from all feeds";
  }

  async run() {
    const logger = this.logger.child({ job: this.name });

    let counter = 0;
    logger.info("Starting feed refresh job");

    const users = await this.repository.findUsers();
    const tasks = users.map(async (user) => {
      const categories = await this.repository.findCategoriesWithFeed(user.id);
      const feeds = categories.flatMap((category) => category.feeds);
      return await Promise.allSettled(
        feeds.map(async (feed) => {
          try {
            return await Promise.allSettled([
              this.feedService.fetchAndSaveEntries(user.id, feed),
              this.feedService.fetchImage(user.id, feed),
            ]);
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
    });
    await Promise.allSettled(tasks);

    logger.info("Completed feed refresh job");
  }
}
