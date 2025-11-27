// @ts-check

import * as cheerio from "cheerio";
import { Agent, fetch } from "undici";
import PQueue from "p-queue";
import os from "node:os";
import retry from "p-retry";

export class DownloadService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger.child({ context: "download-service" });
    this.queue = new PQueue({ concurrency: os.cpus().length });
  }

  /**
   * @param {object} params
   * @param {string} params.url
   * @param {string} [params.etag]
   * @param {string} [params.lastModified]
   * @param {boolean} [params.disableHttp2]
   * @param {string} [params.userAgent]
   * @param {number} [params.priority=0]
   */
  async downloadBinary({ url, etag, lastModified, disableHttp2, userAgent, priority = 0 }) {
    const headers = new Headers();
    headers.set("User-Agent", this.config.userAgent);

    if (etag) headers.set("If-None-Match", etag);
    if (lastModified) headers.set("If-Modified-Since", lastModified);
    if (userAgent) headers.set("User-Agent", userAgent);

    this.logger.debug({ url, etag, lastModified, disableHttp2, userAgent, priority });

    const dispatcher = new Agent({ allowH2: !disableHttp2, bodyTimeout: this.config.httpTimeoutMs });
    const res = await retry(() => this.queue.add(() => fetch(url, { headers, dispatcher }), { priority }));

    this.logger.debug({ url, status: res.status, statusText: res.statusText });
    return res;
  }

  /**
   * @param {object} params
   * @param {string} params.url
   * @param {string} [params.etag]
   * @param {string} [params.lastModified]
   * @param {boolean} [params.disableHttp2]
   * @param {string} [params.userAgent]
   * @param {number} [params.priority=0]
   */
  async downloadText({ url, etag, lastModified, disableHttp2, userAgent, priority = 0 }) {
    const headers = new Headers();
    headers.set("User-Agent", this.config.userAgent);

    if (etag) headers.set("If-None-Match", etag);
    if (lastModified) headers.set("If-Modified-Since", lastModified);
    if (userAgent) headers.set("User-Agent", userAgent);

    this.logger.debug({ url, etag, lastModified, disableHttp2, userAgent, priority });

    const dispatcher = new Agent({ allowH2: !disableHttp2, bodyTimeout: this.config.httpTimeoutMs });
    const res = await retry(() => this.queue.add(() => fetch(url, { headers, dispatcher }), { priority }));

    this.logger.debug({ url, status: res.status, statusText: res.statusText });
    return res;
  }

  /**
   * @param {object} opts
   * @param {string} opts.htmlUrl
   * @param {boolean} [opts.disableHttp2]
   * @returns {Promise<string|undefined>}
   */
  async findFavicon({ htmlUrl, disableHttp2 }) {
    try {
      const headers = new Headers();
      headers.set("User-Agent", this.config.userAgent);

      const dispatcher = new Agent({ allowH2: !disableHttp2, bodyTimeout: this.config.httpTimeoutMs });
      const content = await retry(() => fetch(htmlUrl, { headers, dispatcher }).then((res) => res.text()));
      const $ = cheerio.load(content);
      const href =
        $('link[rel="icon"]').attr("href") ??
        $('link[rel="shortcut icon"]').attr("href") ??
        $('link[rel="apple-touch-icon"]').attr("href");
      if (href) return String(new URL(href, htmlUrl));
      return undefined;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to find favicon", htmlUrl });
      return undefined;
    }
  }

  /**
   * @param {string} url
   * @returns {Promise<string|undefined>}
   */
  async findFeed(url) {
    try {
      const res = await this.downloadText({ url, disableHttp2: false, priority: 1 });
      if (!res.ok) {
        this.logger.error({ status: res.status, statusText: res.statusText, url });
        return undefined;
      }

      const content = await res.text();
      const $ = cheerio.load(content);
      const feedLink =
        $('link[type="application/rss+xml"]').attr("href") ?? $('link[type="application/atom+xml"]').attr("href");
      if (!feedLink) {
        this.logger.warn({ message: "No feed link found in HTML", url });
        return undefined;
      }

      const absoluteFeedUrl = String(new URL(feedLink, url));
      this.logger.info({ message: "Found feed URL", feedUrl: absoluteFeedUrl });
      return absoluteFeedUrl;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to find feed", url });
      return undefined;
    }
  }
}
