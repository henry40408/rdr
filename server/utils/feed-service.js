// @ts-check

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
        disableHttp2: feed.disableHttp2,
        userAgent: feed.userAgent,
        priority: Number.MIN_SAFE_INTEGER, // lowest priority
      });
      logger.info("Fetched feed");

      if (res.status === 304) {
        logger.info("Feed is not modified");
        return { type: "not_modified", feed, items: [] };
      }

      if (!res.ok) {
        logger.error({ status: res.status, statusText: res.statusText, body: await res.text() });
        throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
      }

      const body = await res.text();
      const { items, meta } = await this.parseFeed(body);

      const cloned = structuredClone(feed);
      cloned.etag = res.headers.get("etag") ?? undefined;
      cloned.lastModified = res.headers.get("last-modified") ?? undefined;

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
        logger.debug("Trying to find favicon from HTML");
        const url = await this.downloadService.findFavicon({ htmlUrl: feed.htmlUrl, disableHttp2: feed.disableHttp2 });
        if (url) {
          const result = await this.imageService.download({
            userId,
            externalId: buildFeedImageKey(feed.id),
            url,
            disableHttp2: feed.disableHttp2,
            userAgent: feed.userAgent,
          });
          if (result) {
            logger.debug({ msg: "Fetched favicon from HTML", url });
            return result;
          }
        }
      }
      {
        logger.debug("Trying to fetch favicon from base URL");
        const url = new URL("/favicon.ico", feed.htmlUrl);
        const result = await this.imageService.download({
          userId,
          externalId: buildFeedImageKey(feed.id),
          url: String(url),
          disableHttp2: feed.disableHttp2,
          userAgent: feed.userAgent,
        });
        if (result) return result;
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
        await this.repository.updateFeedMetadata({ userId, feed: result.feed, error: null });
      } else if (result.type === "not_modified") {
        // No new entries, just update feed metadata to clear any previous errors
        await this.repository.updateFeedMetadata({ userId, feed, error: null });
      }
    } catch (e) {
      const err = /** @type {Error} */ (e);
      await this.repository.updateFeedMetadata({ userId, feed, error: err.message }).catch((err) => {
        this.logger.error(err);
        this.logger.error({ msg: "Failed to update feed metadata with error", feedId: feed.id });
      });
    }
  }

  /**
   * @typedef {object} ParseFeedResult
   * @property {import('feedparser').Meta|undefined} meta
   * @property {import('feedparser').Item[]} items
   *
   * @param {string} content
   * @returns {Promise<ParseFeedResult>}
   */
  async parseFeed(content) {
    return new Promise((resolve, reject) => {
      const parser = new FeedParser({});

      /** @type {import('feedparser').Item[]} */
      const items = [];

      /** @type {import('feedparser').Meta|undefined} */
      let meta = undefined;

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
      parser.on("end", () => resolve({ items, meta }));

      Readable.from(content).pipe(parser);
    });
  }

  /**
   * @typedef {object} DiscoverFeedResult
   * @property {string} xmlUrl
   * @property {import('feedparser').Meta} meta
   */

  /**
   * @param {string} url
   * @returns {Promise<DiscoverFeedResult|undefined>}
   */
  async discoverFeed(url) {
    try {
      // Using HTTP/1.1 to maximize compatibility with various feed discovery implementations
      const res = await this.downloadService.downloadText({ url, disableHttp2: true });
      if (!res.ok) {
        this.logger.error({ status: res.status, statusText: res.statusText, body: await res.text() });
        throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
      }

      const content = await res.text();

      try {
        const parsed = await this.parseFeed(content);
        if (parsed?.meta) return { xmlUrl: url, meta: parsed.meta };
      } catch (err) {
        this.logger.error(err);
        this.logger.warn({ message: "Not a feed. Trying to discover feeds from HTML.", url });
      }

      const absoluteFeedUrl = await this.downloadService.findFeed(url);
      if (!absoluteFeedUrl) {
        this.logger.warn({ message: "No feed link found in HTML", url });
        return undefined;
      }

      this.logger.info({ message: "Trying discovered feed URL", feedUrl: absoluteFeedUrl });
      try {
        const feedRes = await this.downloadService.downloadText({ url: absoluteFeedUrl, disableHttp2: true });
        if (!feedRes.ok) {
          this.logger.error({ status: feedRes.status, statusText: feedRes.statusText, body: await feedRes.text() });
          throw new Error(`Failed to fetch discovered feed: ${feedRes.status} ${feedRes.statusText}`);
        }

        const feedContent = await feedRes.text();
        const parsed = await this.parseFeed(feedContent);
        if (parsed?.meta) {
          this.logger.info({ message: "Successfully discovered feed", feedUrl: absoluteFeedUrl });
          return { xmlUrl: absoluteFeedUrl, meta: parsed.meta };
        }
      } catch (err) {
        this.logger.error(err);
        this.logger.warn({ message: "Failed to parse discovered feed URL", feedUrl: absoluteFeedUrl });
      }

      this.logger.warn({ message: "No feeds discovered from HTML", url });
      return undefined;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
