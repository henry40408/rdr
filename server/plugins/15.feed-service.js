import os from "node:os";
import { Readable } from "node:stream";
import FeedParser from "feedparser";
import PQueue from "p-queue";
import { MutexMap } from "../utils/mutex-map";
import { FeedImage, FeedMetadata } from "../utils/entities";

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
   * @property {import('feedparser').Meta|null} [meta]
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

      logger.debug({ msg: "Items parsed", xmlUrl: feed.xmlUrl, count: items.length });

      const etag = res.headers.get("etag");
      const lastModified = res.headers.get("last-modified");
      const newMetadata = new FeedMetadata({ feedId: feed.id, etag, lastModified });
      return { type: "ok", items, meta, metadata: newMetadata };
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      release();
    }
  }

  /**
   * @param {import('../utils/entities').Feed} feed
   * @param {import('../utils/entities').FeedMetadata|null} metadata
   * @returns {Promise<FeedImage|null>}
   */
  async fetchImage(feed, metadata) {
    const { meta } = await this.fetchEntries(feed, metadata);
    if (meta?.image?.url) {
      const image = await this._downloadImage(meta.image.url);
      if (image) {
        const { blob, contentType } = image;
        return new FeedImage({ feedId: feed.id, blob, contentType });
      }
    }

    const url = new URL("/favicon.ico", feed.htmlUrl).toString();
    const image = await this._downloadImage(url);
    if (image) {
      const { blob, contentType } = image;
      return new FeedImage({ feedId: feed.id, blob, contentType });
    }

    return null;
  }

  /**
   *
   * @param {string} url
   * @returns {Promise<{blob:Buffer,contentType:string}|null>}
   */
  async _downloadImage(url) {
    const res = await this.queue.add(() => fetch(url, { headers: { "User-Agent": this.userAgent } }));
    if (!res) {
      this.logger.error("Response is null");
      return null;
    }
    if (!res.ok) {
      this.logger.error(`Failed to fetch image: ${res.status} ${res.statusText} - ${await res.text()}`);
      return null;
    }
    if (!res.body) {
      this.logger.error("Response body is null");
      return null;
    }
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const blob = await res.arrayBuffer();
    return { blob: Buffer.from(blob), contentType };
  }
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  const logger = nitroApp.logger;
  const userAgent = config.userAgent;
  nitroApp.feedService = new FeedService({ logger, userAgent });
});
