import os from "node:os";
import { Readable } from "node:stream";
import * as cheerio from "cheerio";
import FeedParser from "feedparser";
import PQueue from "p-queue";
import got from "got";

export class FeedService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('./image-service').ImageService} opts.imageService
   * @param {import('pino').Logger} opts.logger
   * @param {import('../utils/repository').Repository} opts.repository
   */
  constructor({ config, imageService, logger, repository }) {
    this.config = config;
    this.imageService = imageService;
    this.logger = logger.child({ context: "feed-service" });
    this.repository = repository;

    this.mutexMap = new MutexMap();
    this.queue = new PQueue({ concurrency: os.cpus().length });
  }

  /**
   * @typedef {object} FetchEntriesResult
   * @property {'ok'|'not_modified'} type
   * @property {import('feedparser').Item[]} items
   * @property {import('feedparser').Meta|null} [meta]
   * @property {FeedMetadataEntity} [metadata]
   *
   * @param {import('../utils/entities').FeedEntity} feed
   * @param {import('../utils/entities').FeedMetadataEntity|null} metadata
   * @returns {Promise<FetchEntriesResult>}
   */
  async fetchEntries(feed, metadata) {
    const logger = this.logger.child({ feedId: feed.id, xmlUrl: feed.xmlUrl });

    const mutexKey = `feed-entries-fetch-${feed.id}`;
    const release = await this.mutexMap.acquire(mutexKey);

    try {
      logger.debug("Fetching feed");

      /** @type {Record<string,string>} */
      const headers = { "User-Agent": this.config.userAgent };
      if (metadata) {
        const { etag, lastModified } = metadata;
        if (etag) headers["If-None-Match"] = etag;
        if (lastModified) headers["If-Modified-Since"] = lastModified;
      }

      const res = await this.queue.add(() =>
        got(feed.xmlUrl, {
          headers,
          responseType: "text",
          timeout: { response: this.config.httpTimeoutMs },
        }),
      );
      logger.info("Fetched feed");

      if (!res) {
        logger.error("Response is null");
        throw new Error("Response is null");
      }
      if (304 === res.statusCode) {
        logger.info("Feed is not modified");
        return { type: "not_modified", items: [] };
      }

      const body = res.body;
      const parser = new FeedParser({});

      /** @type {import('feedparser').Item[]} */
      const items = [];

      /** @type {import('feedparser').Meta|null} */
      let meta = null;

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

      logger.debug({ msg: "Items parsed", count: items.length });

      const etag = res.headers["etag"] || null;
      const lastModified = res.headers["last-modified"] || null;
      const newMetadata = new FeedMetadataEntity({ feedId: feed.id, etag, lastModified });
      return { type: "ok", items, meta, metadata: newMetadata };
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      release();
    }
  }

  /**
   * @param {import('../utils/entities').FeedEntity} feed
   * @returns {Promise<ImageEntity|null>}
   */
  async fetchImage(feed) {
    const logger = this.logger.child({ feedId: feed.id });
    const externalId = buildFeedImageExternalId(feed.id);

    const mutexKey = `feed-image-fetch-${feed.id}`;
    const release = await this.mutexMap.acquire(mutexKey);
    try {
      {
        logger.debug("Trying to fetch favicon from base URL");
        const url = new URL("/favicon.ico", feed.htmlUrl).toString();
        const result = await this.imageService.download(externalId, url);
        if (result) return result;
      }
      {
        logger.debug("Trying to find favicon from HTML");
        const url = await this._findFavicon(feed.htmlUrl);
        if (url) {
          const result = await this.imageService.download(externalId, url);
          if (result) return result;
        }
      }
      return null;
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      release();
    }
  }

  /**
   * @param {import('../utils/entities').FeedEntity} feed
   */
  async fetchAndSaveEntries(feed) {
    const metadata = await this.repository.findFeedMetadataByFeedId(feed.id);
    const result = await this.fetchEntries(feed, metadata);
    if (result.type === "ok") {
      await this.repository.upsertEntries(feed, result.items);
      if (result.metadata) await this.repository.upsertFeedMetadata(result.metadata);
    }
  }

  /**
   * @param {string} htmlUrl
   * @returns {Promise<string|null>}
   */
  async _findFavicon(htmlUrl) {
    try {
      const content = await got(htmlUrl, {
        headers: { "User-Agent": this.config.userAgent },
        responseType: "text",
        timeout: { response: this.config.httpTimeoutMs },
      }).text();
      const $ = cheerio.load(content);
      const href =
        $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href") ||
        $('link[rel="apple-touch-icon"]').attr("href");
      if (href) return new URL(href, htmlUrl).toString();
      return null;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to find favicon", htmlUrl });
      return null;
    }
  }
}
