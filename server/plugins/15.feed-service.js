import os from "node:os";
import { Readable } from "node:stream";
import FeedParser from "feedparser";
import PQueue from "p-queue";
import { MutexMap } from "../utils/mutex-map";

export class FeedService {
  /**
   * @param {object} opts
   * @param {import('pino').Logger} opts.logger
   * @param {string} opts.userAgent
   */
  constructor({ logger, userAgent }) {
    this.logger = logger.child({ context: "feed-service" });
    this.mutexMap = new MutexMap();
    this.queue = new PQueue({ concurrency: os.cpus().length });
    this.userAgent = userAgent;
  }

  /**
   * @param {import('../utils/entities').Feed} feed
   * @returns {Promise<import('feedparser').Item[]>}
   */
  async fetchEntries(feed) {
    const logger = this.logger.child({ feedId: feed.id });

    const mutexKey = `feed-fetch-${feed.id}`;
    const release = await this.mutexMap.acquire(mutexKey);
    try {
      logger.debug({ msg: "Fetching feed", xmlUrl: feed.xmlUrl });
      const res = await this.queue.add(() =>
        fetch(feed.xmlUrl, {
          headers: {
            "User-Agent": this.userAgent,
          },
        }),
      );
      logger.info({ msg: "Fetched feed", xmlUrl: feed.xmlUrl });

      if (!res) {
        logger.error("Response is null");
        throw new Error("Response is null");
      }
      if (!res.ok) {
        logger.error(`Failed to fetch feed: ${res.status} ${res.statusText} - ${await res.text()}`);
        throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        logger.error("Response body is null");
        throw new Error("Response body is null");
      }

      const body = res.body;
      const parser = new FeedParser({});

      /** @type {import('feedparser').Item[]} */
      const items = [];

      await new Promise((resolve, reject) => {
        parser.on("error", (/** @type {unknown} */ err) => reject(err));
        parser.on("readable", () => {
          /** @type {import('feedparser').Item} */
          let item;
          while ((item = parser.read())) {
            items.push(item);
          }
        });
        parser.on("end", () => resolve(items));
        Readable.from(body).pipe(parser);
      });

      logger.debug({ msg: "Items parsed", xmlUrl: feed.xmlUrl, count: items.length });
      return items;
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      release();
    }
  }
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  const logger = nitroApp.logger;
  const userAgent = config.userAgent;
  nitroApp.feedService = new FeedService({ logger, userAgent });
});
