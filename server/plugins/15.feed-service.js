import os from "node:os";
import { Readable } from "node:stream";
import FeedParser from "feedparser";
import PQueue from "p-queue";
import { MutexMap } from "../utils/mutex-map";
import { FeedMetadata } from "../utils/entities";

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
   * @typedef {object} FetchResult
   * @property {'ok'|'not_modified'} type
   * @property {import('feedparser').Item[]} items
   * @property {FeedMetadata} [metadata]
   *
   * @param {import('../utils/entities').Feed} feed
   * @param {import('../utils/entities').FeedMetadata|null} metadata
   * @returns {Promise<FetchResult>}
   */
  async fetchEntries(feed, metadata) {
    const logger = this.logger.child({ feedId: feed.id });

    const mutexKey = `feed-fetch-${feed.id}`;
    const release = await this.mutexMap.acquire(mutexKey);
    try {
      logger.debug({ msg: "Fetching feed", xmlUrl: feed.xmlUrl });

      /** @type {Record<string,string>} */
      const headers = { "User-Agent": this.userAgent };
      if (metadata) {
        const { etag, lastModified } = metadata;
        if (etag) headers["If-None-Match"] = etag;
        if (lastModified) headers["If-Modified-Since"] = lastModified;
      }

      const res = await this.queue.add(() => fetch(feed.xmlUrl, { headers }));
      logger.info({ msg: "Fetched feed", xmlUrl: feed.xmlUrl });

      if (!res) {
        logger.error("Response is null");
        throw new Error("Response is null");
      }
      if (304 === res.status) {
        logger.info({ msg: "Feed is not modified", metadata });
        return { type: "not_modified", items: [] };
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

      const etag = res.headers.get("etag");
      const lastModified = res.headers.get("last-modified");
      const newMetadata = new FeedMetadata({ feedId: feed.id, etag, lastModified });
      return { type: "ok", items, metadata: newMetadata };
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
