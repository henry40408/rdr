import FeedParser from "feedparser";
import { Readable } from "node:stream";

export class FeedService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {DownloadService} opts.downloadService
   * @param {ImageService} opts.imageService
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ config, downloadService, imageService, logger, repository }) {
    this.config = config;
    this.downloadService = downloadService;
    this.imageService = imageService;
    this.logger = logger.child({ context: "feed-service" });
    this.repository = repository;
  }

  /**
   * @typedef {object} FetchEntriesResult
   * @property {'ok'|'not_modified'} type
   * @property {FeedEntity} feed
   * @property {import('feedparser').Item[]} items
   * @property {import('feedparser').Meta|undefined} [meta]
   *
   * @param {FeedEntity} feed
   * @returns {Promise<FetchEntriesResult>}
   */
  async fetchEntries(feed) {
    const logger = this.logger.child({ feedId: feed.id, xmlUrl: feed.xmlUrl });

    try {
      logger.debug("Fetching feed");
      const res = await this.downloadService.downloadText({
        url: feed.xmlUrl,
        etag: feed.etag,
        lastModified: feed.lastModified,
        priority: Number.MIN_SAFE_INTEGER, // lowest priority
      });
      logger.info("Fetched feed");

      if (!res) {
        logger.error("Response is undefined");
        throw new Error("Response is undefined");
      }
      if (res.statusCode === 304) {
        logger.info("Feed is not modified");
        return { type: "not_modified", feed, items: [] };
      }

      const body = res.body;
      const parser = new FeedParser({});

      /** @type {import('feedparser').Item[]} */
      const items = [];

      /** @type {import('feedparser').Meta|undefined} */
      let meta = undefined;

      await new Promise((resolve, reject) => {
        parser.on("error", (/** @type {unknown} */ err) => reject(err));
        parser.on("meta", (/** @type {import('feedparser').Meta} */ m) => {
          meta = m;
        });
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

      const cloned = structuredClone(feed);
      cloned.etag = res.headers["etag"];
      cloned.lastModified = res.headers["last-modified"];

      return { type: "ok", items, meta, feed: cloned };
    } catch (err) {
      logger.error(err);
      logger.error({ msg: "Failed to fetch entries", xmlUrl: feed.xmlUrl });
      throw err;
    }
  }

  /**
   * @param {number} userId
   * @param {FeedEntity} feed
   * @returns {Promise<ImageEntity|undefined>}
   */
  async fetchImage(userId, feed) {
    const logger = this.logger.child({ feedId: feed.id });
    try {
      {
        logger.debug("Trying to fetch favicon from base URL");
        const url = new URL("/favicon.ico", feed.htmlUrl).toString();
        const result = await this.imageService.download(userId, buildFeedImageKey(feed.id), url);
        if (result) return result;
      }
      {
        logger.debug("Trying to find favicon from HTML");
        const url = await this.downloadService.findFavicon(feed.htmlUrl);
        if (url) {
          const result = await this.imageService.download(userId, buildFeedImageKey(feed.id), url);
          if (result) {
            logger.debug({ msg: "Fetched favicon from HTML", url });
            return result;
          }
        }
      }
      return undefined;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to fetch feed image", feedId: feed.id });
      throw err;
    }
  }

  /**
   * @param {number} userId
   * @param {FeedEntity} feed
   */
  async fetchAndSaveEntries(userId, feed) {
    try {
      const result = await this.fetchEntries(feed);
      if (result.type === "ok") {
        await this.repository.upsertEntries(userId, feed, result.items, result.meta);
        await this.repository.updateFeedMetadata({ userId, feed: result.feed, error: "" });
      }
    } catch (e) {
      const err = /** @type {Error} */ (e);
      await this.repository.updateFeedMetadata({ userId, feed, error: err.message }).catch((err) => {
        this.logger.error(err);
        this.logger.error({ msg: "Failed to update feed metadata with error", feedId: feed.id });
      });
    }
  }
}
