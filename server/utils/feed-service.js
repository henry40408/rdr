import os from "node:os";
import { Readable } from "node:stream";

import FeedParser from "feedparser";

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
   * @property {import('feedparser').Item[]} items
   * @property {import('feedparser').Meta|undefined} [meta]
   * @property {FeedMetadataEntity|undefined} [metadata]
   *
   * @param {FeedEntity} feed
   * @param {FeedMetadataEntity|undefined} metadata
   * @returns {Promise<FetchEntriesResult>}
   */
  async fetchEntries(feed, metadata) {
    const logger = this.logger.child({ feedId: feed.id, xmlUrl: feed.xmlUrl });

    try {
      logger.debug("Fetching feed");
      const res = await this.downloadService.downloadText({
        url: feed.xmlUrl,
        etag: metadata?.etag,
        lastModified: metadata?.lastModified,
      });
      logger.info("Fetched feed");

      if (!res) {
        logger.error("Response is undefined");
        throw new Error("Response is undefined");
      }
      if (304 === res.statusCode) {
        logger.info("Feed is not modified");
        return { type: "not_modified", items: [] };
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

      const etag = res.headers["etag"];
      const lastModified = res.headers["last-modified"];
      const newMetadata = new FeedMetadataEntity({ feedId: feed.id, etag, lastModified });
      return { type: "ok", items, meta, metadata: newMetadata };
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  /**
   * @param {FeedEntity} feed
   * @returns {Promise<ImageEntity|undefined>}
   */
  async fetchImage(feed) {
    const logger = this.logger.child({ feedId: feed.id });
    try {
      {
        logger.debug("Trying to fetch favicon from base URL");
        const url = new URL("/favicon.ico", feed.htmlUrl).toString();
        const result = await this.imageService.download(feed.id, url);
        if (result) return result;
      }
      {
        logger.debug("Trying to find favicon from HTML");
        const url = await this.downloadService.findFavicon(feed.htmlUrl);
        if (url) {
          const result = await this.imageService.download(feed.id, url);
          if (result) {
            logger.debug({ msg: "Fetched favicon from HTML", url });
            return result;
          }
        }
      }
      return undefined;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  /**
   * @param {FeedEntity} feed
   */
  async fetchAndSaveEntries(feed) {
    const metadata = await this.repository.findFeedMetadataByFeedId(feed.id);
    const result = await this.fetchEntries(feed, metadata);
    if (result.type === "ok") {
      await this.repository.upsertEntries(feed, result.items);
      if (result.metadata) await this.repository.upsertFeedMetadata(result.metadata);
    }
  }
}
